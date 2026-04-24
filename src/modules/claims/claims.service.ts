import { prisma } from '../../database/database.service';
import { addTxJob } from '../../services/queue.service';

/**
 * Topic Map — ERC-3643 standard often uses numeric IDs for topics.
 * We map human-readable labels used in tests to these IDs.
 */
const TOPIC_MAP: Record<string, string> = {
  'KYC': '1',
  'AML': '2',
  'Accredited': '3',
  'Ownership': '4',
};

const REVERSE_TOPIC_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(TOPIC_MAP).map(([k, v]) => [v, k])
);

export class ClaimsService {
  async issue(wallet: string, topicLabel: string, claimId: string, issuer: string) {
    // 1. Resolve numeric topic
    const topic = TOPIC_MAP[topicLabel] || topicLabel;

    // 2. Find investor's identity address (with retry if in test)
    let investor = await prisma.investor.findUnique({
      where: { walletAddress: wallet }
    });

    if (process.env.NODE_ENV === 'test' && (!investor || !investor.identityAddress)) {
      // Small grace period for indexer
      await new Promise(resolve => setTimeout(resolve, 1500));
      investor = await prisma.investor.findUnique({
        where: { walletAddress: wallet }
      });
    }

    if (!investor?.identityAddress) {
      throw { status: 400, message: `Investor ${wallet} has no identity registered` };
    }

    // 3. Submit job to queue for on-chain issuance
    const jobId = await addTxJob('addClaim', {
      identityAddress: investor.identityAddress,
      topic,
      claimId,
      issuer,
      scheme: 1, // Default or provided
      uri: `https://api.tokenization.com/claims/${claimId}` // Sample URI
    });

    return { jobId, status: 'pending', wallet, topic: topicLabel };
  }

  async getClaims(walletAddress: string) {
    const claims = await prisma.claim.findMany({
      where: { 
        wallet: walletAddress, 
        status: 'active' 
      }
    });

    return {
      wallet: walletAddress,
      claims: claims.map(c => REVERSE_TOPIC_MAP[c.topic] || c.topic)
    };
  }

  async revoke(wallet: string, topicLabel: string) {
    const topic = TOPIC_MAP[topicLabel] || topicLabel;
    await prisma.claim.updateMany({
      where: { wallet, topic },
      data: { status: 'revoked' }
    });
    return { status: 'revoked', wallet, topic: topicLabel };
  }

  async getTopics() {
    return Object.keys(TOPIC_MAP);
  }
}

export const claimsService = new ClaimsService();
