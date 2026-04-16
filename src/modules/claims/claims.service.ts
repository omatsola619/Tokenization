import { prisma } from '../../database/database.service';
import { addTxJob } from '../../services/queue.service';

export class ClaimsService {
  async issue(wallet: string, topic: string, claimId: string, issuer: string) {
    // 1. Find investor's identity address
    const investor = await prisma.investor.findUnique({
      where: { walletAddress: wallet }
    });

    if (!investor?.identityAddress) {
      throw { status: 400, message: 'Investor has no identity registered' };
    }

    // 2. Submit job to queue for on-chain issuance
    const jobId = await addTxJob('addClaim', {
      identityAddress: investor.identityAddress,
      topic,
      claimId,
      issuer,
      scheme: 1, // Default or provided
      uri: `https://api.tokenization.com/claims/${claimId}` // Sample URI
    });

    return { jobId, status: 'pending', wallet, topic };
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
