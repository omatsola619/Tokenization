import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection — defaults to localhost:6379
const connection = new IORedis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null, // Required by BullMQ
});

// Main transaction queue
export const txQueue = new Queue('blockchain-tx', { connection });

// Queue events for monitoring
export const txQueueEvents = new QueueEvents('blockchain-tx', { connection });

export type TxJobType =
  | 'mint'
  | 'burn'
  | 'transfer'
  | 'forceTransfer'
  | 'freeze'
  | 'unfreeze'
  | 'freezeTokens'
  | 'pause'
  | 'unpause'
  | 'addClaim';

export interface TxJobData {
  type: TxJobType;
  params: Record<string, any>;
}

/**
 * Add a blockchain transaction job to the queue.
 * Returns immediately with a jobId.
 */
export async function addTxJob(type: TxJobType, params: Record<string, any>): Promise<string> {
  const job = await txQueue.add(type, { type, params } as TxJobData, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 1000 }, // Keep last 1000 completed jobs
    removeOnFail: { count: 500 },
  });

  console.log(`📤 Job ${job.id} added to queue: ${type}`);
  return job.id!;
}

/**
 * Get the status of a job by its ID.
 */
export async function getJobStatus(jobId: string) {
  const job = await txQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  return {
    jobId: job.id,
    type: (job.data as TxJobData).type,
    state, // waiting | active | completed | failed | delayed
    result: job.returnvalue,
    failedReason: job.failedReason,
    progress: job.progress,
    timestamp: job.timestamp,
  };
}

export { connection as redisConnection };
