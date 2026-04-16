import { prisma } from '../../database/database.service';
import { blockchainService } from '../../services/blockchain.service';

export class EventsService {
  async getStatus() {
    const lastEvent = await prisma.event.findFirst({
      orderBy: { blockNumber: 'desc' },
    });

    const publicClient = blockchainService.getPublicClient();
    const latestBlock = await publicClient.getBlockNumber();

    const lastIndexedBlock = lastEvent ? lastEvent.blockNumber : 0;
    const isSynced = BigInt(lastIndexedBlock) >= latestBlock - BigInt(1);

    return {
      lastIndexedBlock,
      latestBlock: latestBlock.toString(),
      isSynced,
      blocksBehind: (latestBlock - BigInt(lastIndexedBlock)).toString(),
      chain: 'hardhat'
    };
  }

  async resync() {
    // Logic for resync would involve clearing events and restarting indexer
    return { status: 'resync_requested', message: 'Clear the events table to trigger a full resync.' };
  }
}

export const eventsService = new EventsService();
