import { prisma } from '../../database/database.service';

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
      where: { address: '0x18e186A9d06A70d1B208A2020fcF55428E532366' },
      data: { isPaused: true }
    });
    return { paused: true };
  }

  async unpause() {
    await prisma.tokenConfig.update({
      where: { address: '0x18e186A9d06A70d1B208A2020fcF55428E532366' },
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
