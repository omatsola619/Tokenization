import { blockchainService } from '../../services/blockchain.service';
import { prisma } from '../../database/database.service';
import { config } from '../../config';

export class AdminService {
  async forceTransfer(from: string, to: string, amount: string) {
    const amountBI = BigInt(amount);

    // Call blockchain for the regulatory forced transfer
    const receipt = await blockchainService.forceTransfer(
      from as `0x${string}`,
      to as `0x${string}`,
      amountBI
    );

    const tx = await prisma.transaction.create({
      data: {
        txHash: receipt.transactionHash,
        from,
        to,
        amount: amountBI,
        type: 'forceTransfer',
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

  async pause() {
    // Call blockchain to pause the token on-chain
    await blockchainService.pauseToken();

    await prisma.tokenConfig.upsert({
      where: { address: config.contracts.token },
      update: { isPaused: true },
      create: {
        address: config.contracts.token,
        name: 'Token',
        symbol: 'TKN',
        isPaused: true,
      }
    });
    return { paused: true };
  }

  async unpause() {
    // Call blockchain to unpause the token on-chain
    await blockchainService.unpauseToken();

    await prisma.tokenConfig.upsert({
      where: { address: config.contracts.token },
      update: { isPaused: false },
      create: {
        address: config.contracts.token,
        name: 'Token',
        symbol: 'TKN',
        isPaused: false,
      }
    });
    return { paused: false };
  }

  async isPaused() {
    // Read real paused status from blockchain, fallback to DB
    try {
      return await blockchainService.isPaused();
    } catch {
      const tokenConfig = await prisma.tokenConfig.findFirst();
      return tokenConfig?.isPaused || false;
    }
  }
}

export const adminService = new AdminService();
