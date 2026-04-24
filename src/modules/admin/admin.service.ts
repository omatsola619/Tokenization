import { blockchainService } from '../../services/blockchain.service';
import { prisma } from '../../database/database.service';
import { config } from '../../config';
import { addTxJob } from '../../services/queue.service';

export class AdminService {
  async forceTransfer(from: string, to: string, amount: string) {
    const amountBI = BigInt(amount);

    const pendingTxHash = `0x_pending_force_${Date.now()}`;
    await prisma.transaction.create({
      data: {
        txHash: pendingTxHash,
        from,
        to,
        amount: amountBI,
        type: 'forceTransfer',
        status: 'pending'
      }
    });

    const jobId = await addTxJob('forceTransfer', {
      from,
      to,
      amount: amount.toString(),
      pendingTxHash
    });

    return { 
      jobId, 
      status: 'pending', 
      from, 
      to, 
      amount,
      txHash: `0x${Buffer.from(jobId).toString('hex').padEnd(64, '0')}`
    };
  }

  async pause() {
    const jobId = await addTxJob('pause', {});
    return { jobId, status: 'pending', action: 'pause', paused: true };
  }

  async unpause() {
    const jobId = await addTxJob('unpause', {});
    return { jobId, status: 'pending', action: 'unpause', paused: false };
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
