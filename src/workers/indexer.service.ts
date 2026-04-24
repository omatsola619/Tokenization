import { prisma } from '../database/database.service';
import { blockchainService } from '../services/blockchain.service';
import { TokenABI, IdentityRegistryABI, IdentityABI } from '../config/abis';
import { config } from '../config';
import { parseEventLogs, PublicClient, Log } from 'viem';
import { withRetry } from '../common/retry';
import { formatAddress } from '../common/address';
import { tokensService } from '../modules/tokens/tokens.service';

export class IndexerService {
  private publicClient: PublicClient;
  private isIndexing = false;

  constructor() {
    this.publicClient = blockchainService.getPublicClient() as PublicClient;
  }

  async start() {
    console.log('🔄 Indexer starting continuous sync...');
    const interval = process.env.NODE_ENV === 'test' ? 500 : 5000;
    setInterval(async () => {
      if (this.isIndexing) return;
      try {
        this.isIndexing = true;
        await this.sync();
      } catch (error) {
        console.error('❌ Indexer Sync Error:', error);
      } finally {
        this.isIndexing = false;
      }
    }, interval);
  }

  private async sync() {
    // 1. Refresh dynamic contract config from DB
    await tokensService.getConfig();

    // 2. Determine start block
    const lastEvent = await prisma.event.findFirst({
      orderBy: { blockNumber: 'desc' },
    });

    let startBlock: bigint;
    const latestBlock = await this.publicClient.getBlockNumber();

    if (lastEvent) {
      startBlock = BigInt(lastEvent.blockNumber + 1);
    } else if (process.env.NODE_ENV === 'test') {
      // In tests, start from current block to avoid syncing past history
      startBlock = latestBlock;
    } else {
      startBlock = BigInt(0);
    }

    if (startBlock > latestBlock) return;

    console.log(`🔌 Syncing events from block ${startBlock} to ${latestBlock}...`);

    const logs = await withRetry(() => this.publicClient.getLogs({
      address: [
        config.contracts.token, 
        config.contracts.identityRegistry,
        config.contracts.claimIssuer
      ].filter(a => !!a && a !== '0x0000000000000000000000000000000000000000') as `0x${string}`[],
      fromBlock: startBlock,
      toBlock: latestBlock,
    }));

    if (logs.length === 0) return;

    console.log(`📦 Found ${logs.length} events to process`);

    for (const log of logs) {
      await this.processLog(log);
    }
  }

  private async processLog(log: Log) {
    // Determine which ABI to use based on the address
    let abi: any;
    const addr = log.address.toLowerCase();
    
    if (addr === config.contracts.token?.toLowerCase()) {
      abi = TokenABI;
    } else if (addr === config.contracts.identityRegistry?.toLowerCase()) {
      abi = IdentityRegistryABI;
    } else {
      // It might be an dynamic Identity contract
      abi = IdentityABI;
    }

    // Capture events with explicit type casting for TS compatibility
    const events = parseEventLogs({
      abi,
      logs: [log]
    }) as any[];

    for (const event of events) {
      const eventName = event.eventName;
      const args = event.args;
      
      // Store event for idempotency
      await prisma.event.upsert({
        where: {
          txHash_logIndex: {
            txHash: log.transactionHash!,
            logIndex: log.logIndex!
          }
        },
        create: {
          blockNumber: Number(log.blockNumber),
          logIndex: log.logIndex!,
          txHash: log.transactionHash!,
          eventName,
          data: args as any
        },
        update: {}
      });

      console.log(`📜 Processing ${eventName}...`);

      switch (eventName) {
        case 'Transfer':
          await this.handleTransfer(event);
          break;
        case 'IdentityRegistered':
          await this.handleIdentityRegistered(event);
          break;
        case 'ClaimAdded':
          await this.handleClaimAdded(event);
          break;
      }
    }
  }

  private async handleTransfer(parsed: any) {
    const { from: rawFrom, to: rawTo, value } = parsed.args;
    const from = formatAddress(rawFrom);
    const to = formatAddress(rawTo);
    const amount = BigInt(value);

    await prisma.$transaction(async (tx) => {
      // 1. Update balances
      if (rawFrom !== '0x0000000000000000000000000000000000000000') {
        const sender = await tx.balance.findUnique({ where: { wallet: from } });
        await tx.balance.upsert({
          where: { wallet: from },
          update: { amount: (sender?.amount || 0n) - amount },
          create: { wallet: from, amount: 0n }
        });
      }

      const receiver = await tx.balance.findUnique({ where: { wallet: to } });
      await tx.balance.upsert({
        where: { wallet: to },
        update: { amount: (receiver?.amount || 0n) + amount },
        create: { wallet: to, amount }
      });

      // 2. Record transaction
      await tx.transaction.upsert({
        where: { txHash: parsed.transactionHash },
        update: { status: 'confirmed' },
        create: {
          txHash: parsed.transactionHash,
          from,
          to,
          amount,
          type: rawFrom === '0x0000000000000000000000000000000000000000' ? 'mint' : 'transfer',
          status: 'confirmed',
        },
      });
    });
  }

  private async handleIdentityRegistered(parsed: any) {
    const { investor: rawInvestor, identity, country } = parsed.args;
    const investor = formatAddress(rawInvestor);

    await prisma.$transaction(async (tx) => {
      await tx.investor.upsert({
        where: { walletAddress: investor },
        update: { 
          identityAddress: identity, 
          country: country.toString(), 
          identityRegistered: true 
        },
        create: {
          walletAddress: investor,
          identityAddress: identity,
          country: country.toString(),
          identityRegistered: true,
          metadata: {}
        }
      });
    });
    console.log(`📜 IdentityRegistered synced: ${investor} -> ${identity}`);
  }

  private async handleClaimAdded(parsed: any) {
    const { claimId, topic, issuer } = parsed.args;
    // The contract address that emitted this event (the Identity contract)
    const identityAddress = parsed.address.toLowerCase();
    
    // Find the wallet/investor associated with this identity address
    const wallet = await prisma.wallet.findFirst({
      where: { 
        identityAddress: { equals: identityAddress, mode: 'insensitive' } 
      }
    });

    // Fallback: search in investors table directly
    const investor = wallet ? null : await prisma.investor.findFirst({
       where: { identityAddress: { equals: identityAddress, mode: 'insensitive' } }
    });

    const finalWalletAddress = wallet?.address || investor?.walletAddress;

    if (!finalWalletAddress) {
      console.warn(`⚠️ ClaimAdded for unknown identity: ${identityAddress}`);
      return;
    }

    await prisma.claim.create({
      data: {
        wallet: formatAddress(finalWalletAddress),
        topic: topic.toString(),
        claimId: claimId.toString(),
        issuer: formatAddress(issuer),
        status: 'active'
      }
    });
    console.log(`📜 Claim synced for ${finalWalletAddress}: Topic ${topic}`);
  }
}

export const indexerService = new IndexerService();
