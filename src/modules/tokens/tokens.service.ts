import { blockchainService } from '../../services/blockchain.service';
import { prisma } from '../../database/database.service';
import { investorsService } from '../investors/investors.service';
import { config as appConfig } from '../../config';
import { parseTransferReasonCode } from '../../common/retry';

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
    // ACTIVATE BLOCKCHAIN
    await blockchainService.mintTokens(wallet as `0x${string}`, amountBI);

    const tx = await prisma.transaction.create({
      data: {
        txHash: `0x_mint_${Date.now()}`,
        from: '0x0',
        to: wallet,
        amount: amountBI,
        type: 'mint',
        status: 'confirmed'
      }
    });

    return {
      jobId: tx.txHash,
      wallet,
      amount
    };
  }

  async batchMint(recipients: { wallet: string, amount: string }[]) {
    for (const { wallet, amount } of recipients) {
      await this.mint(wallet, amount);
    }
    
    return {
      jobId: `job_batch_${Date.now()}`,
      count: recipients.length
    };
  }

  async burn(wallet: string, amount: string) {
    const amountBI = BigInt(amount);

    // Call blockchain to burn tokens
    const receipt = await blockchainService.burnTokens(wallet as `0x${string}`, amountBI);

    const tx = await prisma.transaction.create({
      data: {
        txHash: receipt.transactionHash,
        from: wallet,
        to: '0x0000000000000000000000000000000000000000',
        amount: amountBI,
        type: 'burn',
        status: 'confirmed',
      },
    });

    return {
      status: 'burned',
      txHash: tx.txHash,
      wallet,
      amount,
    };
  }

  async transfer(from: string, to: string, amount: string) {
    const amountBI = BigInt(amount);
    // Pre-flight compliance check
    const [allowed, reasonCode] = await blockchainService.canTransfer(from as `0x${string}`, to as `0x${string}`, amountBI) as [boolean, number];
    if (!allowed) {
      throw { status: 422, message: `compliance check failed: ${parseTransferReasonCode(reasonCode)}` };
    }

    const tx = await prisma.transaction.create({
      data: {
        txHash: `0x_tx_${Date.now()}`,
        from,
        to,
        amount: amountBI,
        type: 'transfer',
        status: 'confirmed'
      }
    });

    return {
      txHash: tx.txHash,
      from,
      to,
      amount
    };
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
