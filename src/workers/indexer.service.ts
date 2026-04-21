import { prisma } from '../database/database.service';
import { blockchainService } from '../services/blockchain.service';
import { TokenABI, IdentityRegistryABI, IdentityABI } from '../config/abis';
import { config } from '../config';
import { parseEventLogs, PublicClient, Log } from 'viem';
import { withRetry } from '../common/retry';
import { formatAddress } from '../common/address';

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
    const lastEvent = await prisma.event.findFirst({
      orderBy: { blockNumber: 'desc' },
    });

    const startBlock = lastEvent ? BigInt(lastEvent.blockNumber + 1) : BigInt(0);
    const latestBlock = await this.publicClient.getBlockNumber();

    if (startBlock > latestBlock) return;

    console.log(`🔌 Syncing events from block ${startBlock} to ${latestBlock}...`);

    const logs = await withRetry(() => this.publicClient.getLogs({
      address: [
        config.contracts.token, 
        config.contracts.identityRegistry,
        config.contracts.claimIssuer
      ],
      fromBlock: startBlock,
      toBlock: latestBlock,
    }));

    if (logs.length === 0) return;

    const parsedLogs = parseEventLogs({
      abi: [...TokenABI, ...IdentityRegistryABI, ...IdentityABI] as any,
      logs: logs,
    });

    for (const parsed of parsedLogs) {
      await this.processEvent(parsed);
    }

    console.log(`✅ Processed ${parsedLogs.length} events.`);
  }

  private async processEvent(parsed: any) {
    console.log(`📝 Processing: ${parsed.eventName} (TX: ${parsed.transactionHash})`);

    // 1. Raw event logging (Idempotent)
    await prisma.event.upsert({
      where: {
        txHash_logIndex: {
          txHash: parsed.transactionHash!,
          logIndex: parsed.logIndex!,
        },
      },
      update: {},
      create: {
        blockNumber: Number(parsed.blockNumber),
        logIndex: parsed.logIndex!,
        txHash: parsed.transactionHash!,
        eventName: parsed.eventName,
        data: this.stringifyBigInt(parsed.args),
      },
    });

    // 2. Stateful processing
    try {
      switch (parsed.eventName) {
        case 'Transfer':
          await this.handleTransfer(parsed);
          break;
        case 'IdentityRegistered':
          await this.handleIdentityRegistered(parsed);
          break;
        case 'AddressFrozen':
          await this.handleAddressFrozen(parsed);
          break;
        case 'TokensFrozen':
          await this.handleTokensFrozen(parsed);
          break;
        case 'TokensUnfrozen':
          await this.handleTokensUnfrozen(parsed);
          break;
        case 'Paused':
          await this.handlePaused(true);
          break;
        case 'Unpaused':
          await this.handlePaused(false);
          break;
        case 'ClaimAdded':
          await this.handleClaimAdded(parsed);
          break;
      }
    } catch (error) {
      console.error(`⚠️ Failed to process state for ${parsed.eventName}:`, error);
    }
  }

  private async handleTransfer(parsed: any) {
    const { from: rawFrom, to: rawTo, value } = parsed.args;
    const from = formatAddress(rawFrom);
    const to = formatAddress(rawTo);
    const amount = BigInt(value);
    const txHash = parsed.transactionHash!;

    await prisma.$transaction(async (tx) => {
      // Update Recipient Balance
      if (rawTo !== '0x0000000000000000000000000000000000000000') {
        await tx.balance.upsert({
          where: { wallet: to },
          update: { amount: { increment: amount } },
          create: { wallet: to, amount: amount },
        });
      }

      // Update Sender Balance
      if (rawFrom !== '0x0000000000000000000000000000000000000000') {
        await tx.balance.upsert({
          where: { wallet: from },
          update: { amount: { decrement: amount } },
          create: { wallet: from, amount: -amount },
        });
      }

      // Record Transaction
      await tx.transaction.upsert({
        where: { txHash },
        update: { status: 'confirmed' },
        create: {
          txHash,
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
        },
      });

      await tx.wallet.upsert({
        where: { address: investor },
        update: { identityAddress: identity },
        create: {
          address: investor,
          investorId: (await tx.investor.findUnique({ where: { walletAddress: investor } }))!.id,
          identityAddress: identity,
          isPrimary: true,
        },
      });
    });
  }

  private async handleAddressFrozen(parsed: any) {
    const { _userAddress, _isFrozen } = parsed.args;
    const wallet = formatAddress(_userAddress);

    await prisma.investor.updateMany({
      where: { walletAddress: wallet },
      data: { frozen: _isFrozen },
    });

    console.log(`🧊 Address ${wallet} frozen=${_isFrozen}`);
  }

  private async handleTokensFrozen(parsed: any) {
    const { _userAddress, _amount } = parsed.args;
    const wallet = formatAddress(_userAddress);
    const amount = BigInt(_amount);

    await prisma.balance.upsert({
      where: { wallet },
      update: { frozen: { increment: amount } },
      create: { wallet, amount: BigInt(0), frozen: amount },
    });

    console.log(`🔒 ${amount} tokens frozen for ${wallet}`);
  }

  private async handleTokensUnfrozen(parsed: any) {
    const { _userAddress, _amount } = parsed.args;
    const amount = BigInt(_amount);

    await prisma.balance.upsert({
      where: { wallet: _userAddress },
      update: { frozen: { decrement: amount } },
      create: { wallet: _userAddress, amount: BigInt(0), frozen: BigInt(0) },
    });

    console.log(`🔓 ${amount} tokens unfrozen for ${_userAddress}`);
  }

  private async handlePaused(isPaused: boolean) {
    // Update all token configs — in our single-token setup, update the first one
    await prisma.tokenConfig.updateMany({
      data: { isPaused },
    });

    console.log(`Paused: ${isPaused}`);
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

    if (!wallet) {
      console.warn(`⚠️ ClaimAdded for unknown identity: ${identityAddress}`);
      return;
    }

    await prisma.claim.create({
      data: {
        wallet: formatAddress(wallet.address), // Ensure it uses the formatted version if different
        topic: topic.toString(),
        claimId: claimId,
        issuer: formatAddress(issuer),
        status: 'active'
      }
    });

    console.log(`📜 Claim synced for ${formatAddress(wallet.address)}: Topic ${topic}`);
  }

  private stringifyBigInt(obj: any): any {
    return JSON.parse(JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));
  }
}

export const indexerService = new IndexerService();
