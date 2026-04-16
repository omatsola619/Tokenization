import { blockchainService } from '../../services/blockchain.service';
import { prisma } from '../../database/database.service';
import { investorsService } from '../investors/investors.service';
import { config as appConfig } from '../../config';
import { parseTransferReasonCode } from '../../common/retry';
import { addTxJob } from '../../services/queue.service';

export class TokensService {
  private async getConfigFromDb() {
    const config = await prisma.tokenConfig.findFirst();
    if (!config) {
      // Fallback or initialization logic
      return {
        address: appConfig.contracts.token,
        name: 'Acme Security Token',
        symbol: 'ACME',
        decimals: 18,
        totalSupply: '0',
        isPaused: false
      };
    }
    return {
      ...config,
      totalSupply: config.totalSupply.toString(),
    };
  }

  async deploy(name: string, symbol: string, decimals: number, complianceModule: string) {
    const tokenConfig = await prisma.tokenConfig.upsert({
      where: { address: appConfig.contracts.token }, // For now we assume a single token
      update: { name, symbol, decimals },
      create: {
        address: appConfig.contracts.token,
        name,
        symbol,
        decimals
      }
    });
    return {
      ...tokenConfig,
      tokenAddress: appConfig.contracts.token,
      identityRegistry: appConfig.contracts.identityRegistry,
      complianceContract: appConfig.contracts.compliance,
      totalSupply: tokenConfig.totalSupply.toString(),
    };
  }

  async getConfig() {
    return await this.getConfigFromDb();
  }

  async getPortfolio(wallet: string) {
    if (!(await investorsService.exists(wallet))) {
      throw { status: 404, message: 'investor not found' };
    }

    const config = await this.getConfigFromDb();
    const balance = await this.getBalance(wallet);

    return {
      wallet,
      holdings: [
        {
          token: config.address,
          symbol: config.symbol,
          balance
        }
      ]
    };
  }

  async mint(wallet: string, amount: string) {
    const amountBI = BigInt(amount);
    
    // Create a pending transaction record
    const pendingTxHash = `0x_pending_${Date.now()}`;
    await prisma.transaction.create({
      data: {
        txHash: pendingTxHash,
        from: '0x0000000000000000000000000000000000000000',
        to: wallet,
        amount: amountBI,
        type: 'mint',
        status: 'pending'
      }
    });

    // 2. Submit to queue
    const jobId = await addTxJob('mint', {
      wallet,
      amount: amount.toString(),
      pendingTxHash
    });

    return { jobId, status: 'pending', wallet, amount };
  }

  async batchMint(recipients: { wallet: string, amount: string }[]) {
    const jobs = [];
    for (const recipient of recipients) {
      jobs.push(await this.mint(recipient.wallet, recipient.amount));
    }
    
    return {
      status: 'pending',
      count: recipients.length,
      jobs
    };
  }

  async burn(wallet: string, amount: string) {
    const amountBI = BigInt(amount);

    const pendingTxHash = `0x_pending_burn_${Date.now()}`;
    await prisma.transaction.create({
      data: {
        txHash: pendingTxHash,
        from: wallet,
        to: '0x0000000000000000000000000000000000000000',
        amount: amountBI,
        type: 'burn',
        status: 'pending',
      },
    });

    const jobId = await addTxJob('burn', {
      wallet,
      amount: amount.toString(),
      pendingTxHash
    });

    return { jobId, status: 'pending', wallet, amount };
  }

  async transfer(from: string, to: string, amount: string) {
    const amountBI = BigInt(amount);
    // Pre-flight compliance check
    const [allowed, reasonCode] = await blockchainService.canTransfer(from as `0x${string}`, to as `0x${string}`, amountBI) as [boolean, number];
    if (!allowed) {
      throw { status: 422, message: `compliance check failed: ${parseTransferReasonCode(reasonCode)}` };
    }

    const pendingTxHash = `0x_pending_tx_${Date.now()}`;
    await prisma.transaction.create({
      data: {
        txHash: pendingTxHash,
        from,
        to,
        amount: amountBI,
        type: 'transfer',
        status: 'pending'
      }
    });

    const jobId = await addTxJob('transfer', {
      from,
      to,
      amount: amount.toString(),
      pendingTxHash
    });

    return { jobId, status: 'pending', from, to, amount };
  }

  async batchTransfer(transfers: { from: string, to: string, amount: string }[]) {
    for (const tx of transfers) {
      await this.transfer(tx.from, tx.to, tx.amount);
    }
    return {
      jobId: `job_batch_tx_${Date.now()}`
    };
  }

  async simulateTransfer(from: string, to: string, amount: string) {
    try {
      const [allowed, reasonCode] = await blockchainService.canTransfer(from as `0x${string}`, to as `0x${string}`, BigInt(amount)) as [boolean, number];
      return {
        canTransfer: allowed,
        reasonCode,
        reason: allowed ? 'Transfer is compliant' : parseTransferReasonCode(reasonCode)
      };
    } catch (error) {
      return {
        canTransfer: false,
        reasonCode: -1,
        reason: 'Simulation error: check identity and balance'
      };
    }
  }

  async getBalance(wallet: string) {
    const balance = await prisma.balance.findUnique({
      where: { wallet },
    });
    return (balance?.amount ?? BigInt(0)).toString();
  }
}

export const tokensService = new TokensService();
