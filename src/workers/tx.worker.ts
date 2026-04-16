import { Worker, Job } from 'bullmq';
import { blockchainService } from '../services/blockchain.service';
import { prisma } from '../database/database.service';
import { redisConnection } from '../services/queue.service';
import { TxJobData } from '../services/queue.service';

/**
 * TX Worker — processes blockchain transactions from the queue.
 * Each job type maps to a blockchain service method.
 */
const txWorker = new Worker(
  'blockchain-tx',
  async (job: Job<TxJobData>) => {
    const { type, params } = job.data;
    console.log(`⚙️ Processing job ${job.id}: ${type}`);

    try {
      let result: any;

      switch (type) {
        case 'mint': {
          const receipt = await blockchainService.mintTokens(
            params.wallet as `0x${string}`,
            BigInt(params.amount)
          );
          // Record transaction with real hash
          await prisma.transaction.upsert({
            where: { txHash: params.pendingTxHash },
            update: { txHash: receipt.transactionHash, status: 'confirmed' },
            create: {
              txHash: receipt.transactionHash,
              from: '0x0000000000000000000000000000000000000000',
              to: params.wallet,
              amount: BigInt(params.amount),
              type: 'mint',
              status: 'confirmed',
            },
          });
          result = { txHash: receipt.transactionHash };
          break;
        }

        case 'burn': {
          const receipt = await blockchainService.burnTokens(
            params.wallet as `0x${string}`,
            BigInt(params.amount)
          );
          await prisma.transaction.upsert({
            where: { txHash: params.pendingTxHash },
            update: { txHash: receipt.transactionHash, status: 'confirmed' },
            create: {
              txHash: receipt.transactionHash,
              from: params.wallet,
              to: '0x0000000000000000000000000000000000000000',
              amount: BigInt(params.amount),
              type: 'burn',
              status: 'confirmed',
            },
          });
          result = { txHash: receipt.transactionHash };
          break;
        }

        case 'transfer': {
          // Note: canTransfer is already checked before queueing
          // In a production system, you'd also do an on-chain transfer here
          result = { status: 'confirmed' };
          break;
        }

        case 'forceTransfer': {
          const receipt = await blockchainService.forceTransfer(
            params.from as `0x${string}`,
            params.to as `0x${string}`,
            BigInt(params.amount)
          );
          await prisma.transaction.upsert({
            where: { txHash: params.pendingTxHash },
            update: { txHash: receipt.transactionHash, status: 'confirmed' },
            create: {
              txHash: receipt.transactionHash,
              from: params.from,
              to: params.to,
              amount: BigInt(params.amount),
              type: 'forceTransfer',
              status: 'confirmed',
            },
          });
          result = { txHash: receipt.transactionHash };
          break;
        }

        case 'freeze': {
          await blockchainService.freezeAddress(params.wallet as `0x${string}`, true);
          await prisma.investor.update({
            where: { walletAddress: params.wallet },
            data: { frozen: true },
          });
          result = { wallet: params.wallet, frozen: true };
          break;
        }

        case 'unfreeze': {
          await blockchainService.freezeAddress(params.wallet as `0x${string}`, false);
          await prisma.investor.update({
            where: { walletAddress: params.wallet },
            data: { frozen: false },
          });
          result = { wallet: params.wallet, frozen: false };
          break;
        }

        case 'freezeTokens': {
          await blockchainService.freezePartialTokens(
            params.wallet as `0x${string}`,
            BigInt(params.amount)
          );
          result = { wallet: params.wallet, frozenAmount: params.amount };
          break;
        }

        case 'pause': {
          await blockchainService.pauseToken();
          await prisma.tokenConfig.updateMany({ data: { isPaused: true } });
          result = { paused: true };
          break;
        }

        case 'unpause': {
          await blockchainService.unpauseToken();
          await prisma.tokenConfig.updateMany({ data: { isPaused: false } });
          result = { paused: false };
          break;
        }

        default:
          throw new Error(`Unknown job type: ${type}`);
      }

      console.log(`✅ Job ${job.id} completed: ${type}`);
      return result;

    } catch (error: any) {
      console.error(`❌ Job ${job.id} failed: ${type}`, error.message || error);

      // Update pending transaction to failed status if applicable
      if (params.pendingTxHash) {
        await prisma.transaction.update({
          where: { txHash: params.pendingTxHash },
          data: { status: 'failed' },
        }).catch(() => {}); // Ignore if not found
      }

      throw error; // Let BullMQ handle retries
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Process one blockchain TX at a time to avoid nonce issues
  }
);

txWorker.on('completed', (job) => {
  console.log(`🎉 Job ${job.id} finished successfully`);
});

txWorker.on('failed', (job, err) => {
  console.error(`💀 Job ${job?.id} failed permanently:`, err.message);
});

export { txWorker };
