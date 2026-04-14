import { prisma } from '../../database/database.service';
import { config } from '../../config';

export class AdminService {
  async forceTransfer(from: string, to: string, amount: string) {
    const tx = await prisma.transaction.create({
      data: {
        txHash: `0x_force_${Math.random().toString(16).slice(2, 66)}`,
        from,
        to,
        amount: BigInt(amount),
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
    await prisma.tokenConfig.update({
      where: { address: config.contracts.token },
      data: { isPaused: true }
    });
    return { paused: true };
  }

  async unpause() {
    await prisma.tokenConfig.update({
      where: { address: config.contracts.token },
      data: { isPaused: false }
    });
    return { paused: false };
  }

  async isPaused() {
    const config = await prisma.tokenConfig.findFirst();
    return config?.isPaused || false;
  }
}

export const adminService = new AdminService();
