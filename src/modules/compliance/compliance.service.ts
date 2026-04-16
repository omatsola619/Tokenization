import { blockchainService } from '../../services/blockchain.service';
import { prisma } from '../../database/database.service';
import { addTxJob } from '../../services/queue.service';

export class ComplianceService {
  async freeze(wallet: string) {
    const jobId = await addTxJob('freeze', { wallet });
    return { jobId, status: 'pending', wallet, action: 'freeze' };
  }

  async unfreeze(wallet: string) {
    const jobId = await addTxJob('unfreeze', { wallet });
    return { jobId, status: 'pending', wallet, action: 'unfreeze' };
  }

  async freezeTokens(wallet: string, amount: string) {
    const jobId = await addTxJob('freezeTokens', {
      wallet,
      amount: amount.toString()
    });

    return { jobId, status: 'pending', wallet, amount };
  }

  async getStatus(wallet: string) {
    const investor = await prisma.investor.findUnique({
      where: { walletAddress: wallet }
    });
    if (!investor) throw { status: 404, message: 'investor not found' };

    // Get real frozen status and frozen token amount from blockchain
    let frozen = investor.frozen;
    let frozenTokens = '0';

    try {
      frozen = await blockchainService.isFrozen(wallet as `0x${string}`);
      const frozenAmount = await blockchainService.getFrozenTokens(wallet as `0x${string}`);
      frozenTokens = frozenAmount.toString();
    } catch {
      // Fallback to DB values if blockchain is unavailable
      const balance = await prisma.balance.findUnique({ where: { wallet } });
      frozenTokens = (balance?.frozen ?? BigInt(0)).toString();
    }

    return {
      wallet: investor.walletAddress,
      frozen,
      frozenTokens
    };
  }
}

export const complianceService = new ComplianceService();
