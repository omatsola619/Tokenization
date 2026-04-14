import { prisma } from '../../database/database.service';

export class ClaimsService {
  async issue(wallet: string, topic: string, claimId: string, issuer: string) {
    const claim = await prisma.claim.create({
      data: {
        wallet,
        topic,
        claimId,
        issuer,
        status: 'active'
      }
    });

    return claim;
  }

  async getClaims(wallet: string) {
    const claims = await prisma.claim.findMany({
      where: { wallet, status: 'active' }
    });
    return {
      wallet,
      claims: claims.map(c => c.topic)
    };
  }

  async revoke(wallet: string, topic: string) {
    await prisma.claim.updateMany({
      where: { wallet, topic },
      data: { status: 'revoked' }
    });
    return { status: 'revoked', wallet, topic };
  }


  async getTopics() {
    return ['KYC', 'AML', 'Accredited', 'Ownership'];
  }
}

export const claimsService = new ClaimsService();
