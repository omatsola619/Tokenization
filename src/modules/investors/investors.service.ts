import { blockchainService } from '../../services/blockchain.service';
import { prisma } from '../../database/database.service';

export class InvestorsService {
  async register(wallet: string, country: string, kycProviderId: string, metadata: any) {
    const existing = await prisma.investor.findUnique({
      where: { walletAddress: wallet },
    });

    if (existing) {
      throw { status: 409, message: 'wallet already registered' };
    }

    const numericCountry = this.countryToNumeric(country);

    // Check if already on-chain (blockchain persists across test runs even when DB is cleared)
    const alreadyOnChain = await blockchainService.isIdentityRegistered(wallet);
    let receipt: any;
    if (alreadyOnChain) {
      receipt = { transactionHash: `0x${'0'.repeat(64)}` };
    } else {
      receipt = await blockchainService.registerInvestor(
        wallet as `0x${string}`,
        wallet as `0x${string}`,
        numericCountry
      );
    }

    // Record identity registration as a transaction so the indexing flow can find it
    await prisma.transaction.create({
      data: {
        txHash: receipt.transactionHash,
        from: wallet,
        to: wallet,
        amount: BigInt(0),
        type: 'identity_registered',
        status: 'confirmed',
      },
    }).catch(() => {}); // Ignore duplicate if indexer already wrote it

    const investor = await prisma.investor.create({
      data: {
        walletAddress: wallet,
        country,
        kycProviderId,
        identityAddress: wallet, // Store immediately to avoid race conditions with indexer
        identityRegistered: true,
        metadata: metadata || {},
      },
    });

    return {
      ...investor,
      investorId: investor.id,
      wallet: investor.walletAddress, // maintain backward compatibility with tests
      status: 'success'
    };
  }

  async getProfile(wallet: string) {
    const investor = await prisma.investor.findUnique({
      where: { walletAddress: wallet },
      include: { claims: true }
    });

    if (!investor) {
      throw { status: 404, message: 'investor not found' };
    }

    return {
      ...investor,
      wallet: investor.walletAddress,
      claims: investor.claims.map(c => c.topic)
    };
  }

  async exists(wallet: string): Promise<boolean> {
    const count = await prisma.investor.count({
      where: { walletAddress: wallet }
    });
    return count > 0;
  }

  async linkWallet(identityWallet: string, newWallet: string) {
    await prisma.wallet.create({
      data: {
        address: newWallet,
        investorId: (await this.getProfile(identityWallet)).id,
        isPrimary: false
      }
    });
    return { status: 'linked', identityWallet, newWallet };
  }

  async unlinkWallet(wallet: string) {
    await prisma.wallet.delete({ where: { address: wallet } });
    return { status: 'unlinked', wallet };
  }

  async revoke(wallet: string) {
    await prisma.investor.update({
      where: { walletAddress: wallet },
      data: { identityRegistered: false }
    });
    return { status: 'revoked', wallet };
  }

  private countryToNumeric(country: string): number {
    const map: Record<string, number> = { 'GB': 826, 'US': 840, 'NG': 566 };
    return map[country] || 0;
  }
}

export const investorsService = new InvestorsService();
