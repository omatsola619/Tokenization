import { Worker, Job } from 'bullmq';
import { blockchainService } from '../services/blockchain.service';
import { prisma } from '../database/database.service';
import { redisConnection } from '../services/queue.service';
import { TxJobData } from '../services/queue.service';

let _worker: Worker | null = null;

/**
 * TX Worker — processes blockchain transactions from the queue.
 * Each job type maps to a blockchain service method.
 */
export const runTxWorker = async () => {
  if (_worker) return;

  _worker = new Worker(
    'blockchain-tx',
    async (job: Job<TxJobData>) => {
      const { type, params } = job.data;
      console.log(`⚙️ Processing job ${job.id}: ${type}`);

      try {
        let result: any;

        switch (type) {
          case 'mint': {
            const receipt = await blockchainService.mintTokens(
              params.wallet,
              BigInt(params.amount)
            );
            
            await prisma.transaction.upsert({
              where: { txHash: receipt.transactionHash },
              update: { status: 'confirmed' },
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
              params.wallet,
              BigInt(params.amount)
            );
            await prisma.transaction.upsert({
              where: { txHash: receipt.transactionHash },
              update: { status: 'confirmed' },
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
            const receipt = await blockchainService.forceTransfer(
              params.from,
              params.to,
              BigInt(params.amount)
            );
            await prisma.transaction.upsert({
              where: { txHash: receipt.transactionHash },
              update: { status: 'confirmed' },
              create: {
                txHash: receipt.transactionHash,
                from: params.from,
                to: params.to,
                amount: BigInt(params.amount),
                type: 'transfer',
                status: 'confirmed',
              },
            });
            result = { txHash: receipt.transactionHash };
            break;
          }

          case 'forceTransfer': {
            const receipt = await blockchainService.forceTransfer(
              params.from,
              params.to,
              BigInt(params.amount)
            );
            await prisma.transaction.upsert({
              where: { txHash: receipt.transactionHash },
              update: { status: 'confirmed' },
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
            await blockchainService.freezeAddress(params.wallet, true);
            await prisma.investor.update({
              where: { walletAddress: params.wallet },
              data: { frozen: true },
            });
            result = { wallet: params.wallet, frozen: true };
            break;
          }

          case 'unfreeze': {
            await blockchainService.freezeAddress(params.wallet, false);
            await prisma.investor.update({
              where: { walletAddress: params.wallet },
              data: { frozen: false },
            });
            result = { wallet: params.wallet, frozen: false };
            break;
          }

          case 'freezeTokens': {
            await blockchainService.freezePartialTokens(
              params.wallet,
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
          
          case 'addClaim': {
            const { identityAddress, topic, scheme, issuer, uri } = params;
            const receipt = await blockchainService.addClaim(
              identityAddress,
              BigInt(topic),
              BigInt(scheme || 1),
              issuer,
              '0x' as `0x${string}`, // Signature
              '0x' as `0x${string}`, // Data
              uri
            );
            result = { txHash: receipt.transactionHash };
            break;
          }

          default:
            throw new Error(`Unknown job type: ${type}`);
        }

        console.log(`✅ Job ${job.id} completed: ${type}`);
        return result;

      } catch (error: any) {
        console.error(`❌ Job ${job.id} failed: ${type}`, error.message || error);

        // If the error was a duplicate key, it means the indexer already did the work.
        // We can treat this as success for the worker.
        if (error.code === 'P2002') {
          console.log(`ℹ️ Job ${job.id} detected duplicate record (already indexed).`);
          return { status: 'confirmed' };
        }

        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 1,
    }
  );

  _worker.on('completed', (job) => {
    console.log(`🎉 Job ${job.id} finished successfully`);
  });

  _worker.on('failed', (job, err) => {
    console.warn(`💀 Job ${job?.id} failed:`, err.message);
  });

  console.log('📦 Transaction Worker initialized and listening');
};

export const getTxWorker = () => _worker;
