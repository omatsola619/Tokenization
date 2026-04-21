import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection config
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null, // Required by BullMQ
  lazyConnect: true,
};

/**
 * Main Redis connection for the application.
 */
export const redisConnection = new IORedis(redisConfig);
redisConnection.on('error', (err) => {
  if (process.env.NODE_ENV === 'test') return;
  console.error('Redis connection error:', err.message);
});

// Lazy-initialized Queue and Events
let _txQueue: Queue | null = null;
let _txQueueEvents: QueueEvents | null = null;

export const getTxQueue = () => {
  if (!_txQueue) {
    _txQueue = new Queue('blockchain-tx', { 
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
      }
    });
  }
  return _txQueue;
};

export const getTxQueueEvents = () => {
  if (!_txQueueEvents) {
    _txQueueEvents = new QueueEvents('blockchain-tx', { 
      connection: redisConnection 
    });
  }
  return _txQueueEvents;
};

// For backward compatibility with existing imports
export const txQueue = new Proxy({} as Queue, {
  get: (target, prop) => {
    return (getTxQueue() as any)[prop];
  }
});

export const txQueueEvents = new Proxy({} as QueueEvents, {
  get: (target, prop) => {
    return (getTxQueueEvents() as any)[prop];
  }
});

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
  const job = await getTxQueue().add(type, { type, params } as TxJobData, {
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
  const job = await getTxQueue().getJob(jobId);
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
