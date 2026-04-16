import { prisma } from '../../database/database.service';

export class IssuersService {
  async addTrusted(issuerWallet: string, topics: string[]) {
    const issuer = await prisma.trustedIssuer.upsert({
      where: { wallet: issuerWallet },
      update: { topics },
      create: { wallet: issuerWallet, topics },
    });

    return { issuerWallet: issuer.wallet, topics: issuer.topics };
  }

  async removeTrusted(issuerWallet: string) {
    await prisma.trustedIssuer.delete({ where: { wallet: issuerWallet } });
    return { status: 'removed', issuerWallet };
  }

  async getAllTrusted() {
    const issuers = await prisma.trustedIssuer.findMany();
    return issuers.map(i => ({ wallet: i.wallet, topics: i.topics }));
  }
}

export const issuersService = new IssuersService();
