import { prisma } from '../../database/database.service';
import { blockchainService } from '../../services/blockchain.service';

export class HealthService {
  async getApiHealth() {
    let dbStatus = 'ok';
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (e) {
      dbStatus = 'error';
    }

    return {
      status: 'ok',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }

  async getBlockchainHealth() {
    try {
      const publicClient = blockchainService.getPublicClient();
      const blockNumber = await publicClient.getBlockNumber();
      const chainId = await publicClient.getChainId();

      return {
        status: 'ok',
        connected: true,
        chainId: chainId,
        blockNumber: blockNumber.toString()
      };
    } catch (error) {
      return {
        status: 'error',
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const healthService = new HealthService();
