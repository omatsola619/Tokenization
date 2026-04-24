import { txQueue, txQueueEvents } from '../services/queue.service';
import { prisma } from '../database/database.service';

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
    if (result && result.txHash) {
      for (let i = 0; i < 20; i++) { // Max 10 seconds
        const tx = await prisma.transaction.findUnique({
          where: { txHash: result.txHash }
        });
        if (tx && tx.status === 'confirmed') return;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  } catch (error) {
    console.warn(`Wait for job ${jobId} failed or timed out:`, error);
  }
}

/**
 * Specifically wait for a claim to appear in the database for a wallet.
 */
export async function waitForClaimSync(wallet: string, topicLabel: string) {
  if (process.env.NODE_ENV !== 'test') return;

  // Map to numeric ID if needed (matches Indexer storage)
  const topic = topicLabel === 'KYC' ? '1' : 
                topicLabel === 'AML' ? '2' : 
                topicLabel === 'Accredited' ? '3' : 
                topicLabel === 'Ownership' ? '4' : topicLabel;

  for (let i = 0; i < 20; i++) { // Max 10 seconds
    const claim = await prisma.claim.findFirst({
      where: { wallet, topic, status: 'active' }
    });
    if (claim) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.warn(`Wait for claim ${topicLabel} (${topic}) for ${wallet} timed out.`);
}

/**
 * Wait for a wallet to have a registered identity address in the database.
 */
export async function waitForIdentitySync(wallet: string) {
  if (process.env.NODE_ENV !== 'test') return;

  for (let i = 0; i < 20; i++) { // Max 10 seconds
    const investor = await prisma.investor.findUnique({
      where: { walletAddress: wallet }
    });
    if (investor && investor.identityAddress) return;
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.warn(`Wait for identity sync for ${wallet} timed out.`);
}
