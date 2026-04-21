import { txQueue, txQueueEvents } from '../services/queue.service';
import { prisma } from '../database/database.service';
import { blockchainService } from '../services/blockchain.service';

/**
 * Utility for E2E tests to wait for a background job and its corresponding
 * blockchain events to be indexed.
 */
export async function waitForJobAndSync(jobId: string) {
  if (process.env.NODE_ENV !== 'test') return;

  const job = await txQueue.getJob(jobId);
  if (!job) return;

  // 1. Wait for BullMQ job completion
  try {
    const result = await job.waitUntilFinished(txQueueEvents, 20000); // 20s timeout
    
    // 2. Wait for the Indexer to pick up the transaction
    // If the job returned a txHash, we wait until it exists in our 'events' or 'transactions' table
    if (result && result.txHash) {
      let synced = false;
      for (let i = 0; i < 20; i++) { // Max 10 seconds (20 * 500ms)
        const tx = await prisma.transaction.findUnique({
          where: { txHash: result.txHash }
        });
        if (tx && tx.status === 'confirmed') {
          synced = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  } catch (error) {
    console.warn(`Wait for job ${jobId} failed or timed out:`, error);
  }
}
