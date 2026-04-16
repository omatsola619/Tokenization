import { prisma } from '../../database/database.service';
import { investorsService } from '../investors/investors.service';

export class PortfolioService {
  async getByWallet(wallet: string) {
    const investor = await prisma.investor.findUnique({
      where: { walletAddress: wallet },
      include: {
        claims: true
      }
    });

    if (!investor) {
      throw { status: 404, message: 'Investor not found' };
    }

    const balance = await prisma.balance.findUnique({
      where: { wallet }
    });

    const tokenConfig = await prisma.tokenConfig.findFirst() || {
      symbol: 'TKN',
      name: 'Token',
      decimals: 18
    };

    return {
      investor: {
        wallet: investor.walletAddress,
        country: investor.country,
        identityAddress: investor.identityAddress,
        identityRegistered: investor.identityRegistered,
        frozen: investor.frozen
      },
      portfolio: [
        {
          symbol: tokenConfig.symbol,
          name: tokenConfig.name,
          balance: (balance?.amount ?? BigInt(0)).toString(),
          frozen: (balance?.frozen ?? BigInt(0)).toString(),
          total: ((balance?.amount ?? BigInt(0)) + (balance?.frozen ?? BigInt(0))).toString()
        }
      ],
      claims: investor.claims.map(c => ({
        topic: c.topic,
        status: c.status,
        issuedAt: c.createdAt
      }))
    };
  }
}

export const portfolioService = new PortfolioService();
