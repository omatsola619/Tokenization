import { prisma } from '../../database/database.service';

export class ComplianceService {
  async freeze(wallet: string) {
    await prisma.investor.update({
      where: { walletAddress: wallet },
      data: { frozen: true }
    });
    return { wallet, frozen: true };
  }

  async unfreeze(wallet: string) {
    await prisma.investor.update({
      where: { walletAddress: wallet },
      data: { frozen: false }
    });
    return { wallet, frozen: false };
  }

  async freezeTokens(wallet: string, amount: string) {
    const investor = await prisma.investor.findUnique({ where: { walletAddress: wallet } });
    const meta = (investor?.metadata as any) || {};
    
    await prisma.investor.update({
      where: { walletAddress: wallet },
      data: {
        metadata: {
          ...meta,
          frozenAmount: amount
        }
      }
    });

    return { wallet, frozenAmount: amount };
  }

  async getStatus(wallet: string) {
    const investor = await prisma.investor.findUnique({
      where: { walletAddress: wallet }
    });
    if (!investor) throw { status: 404, message: 'investor not found' };

    const meta = (investor.metadata as any) || {};

    return {
      wallet: investor.walletAddress,
      frozen: investor.frozen,
      frozenTokens: meta.frozenAmount || '0'
    };
  }
}

export const complianceService = new ComplianceService();
