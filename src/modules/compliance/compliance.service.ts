import { blockchainService } from '../../services/blockchain.service';
import { prisma } from '../../database/database.service';

export class ComplianceService {
  async freeze(wallet: string) {
    // Call blockchain to freeze the address on-chain
    await blockchainService.freezeAddress(wallet as `0x${string}`, true);

    await prisma.investor.update({
      where: { walletAddress: wallet },
      data: { frozen: true }
    });
    return { wallet, frozen: true };
  }

  async unfreeze(wallet: string) {
    // Call blockchain to unfreeze the address on-chain
    await blockchainService.freezeAddress(wallet as `0x${string}`, false);

    await prisma.investor.update({
      where: { walletAddress: wallet },
      data: { frozen: false }
    });
    return { wallet, frozen: false };
  }

  async freezeTokens(wallet: string, amount: string) {
    const amountBI = BigInt(amount);

    // Call blockchain to freeze partial tokens on-chain
    await blockchainService.freezePartialTokens(wallet as `0x${string}`, amountBI);

    // Update frozen amount in the balance table
    await prisma.balance.upsert({
      where: { wallet },
      update: { frozen: amountBI },
      create: { wallet, amount: BigInt(0), frozen: amountBI },
    });

    return { wallet, frozenAmount: amount };
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
