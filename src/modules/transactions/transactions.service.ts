import { prisma } from '../../database/database.service';

export class TransactionsService {
  async getByHash(txHash: string) {
    const tx = await prisma.transaction.findUnique({
      where: { txHash }
    });
    if (!tx) throw { status: 404, message: 'transaction not found' };
    
    return {
      ...tx,
      amount: tx.amount.toString()
    };
  }

  async getByWallet(wallet: string) {
    const txs = await prisma.transaction.findMany({
      where: {
        OR: [
          { from: wallet },
          { to: wallet }
        ]
      }
    });

    return txs.map(tx => ({
      ...tx,
      amount: tx.amount.toString()
    }));
  }
}

export const transactionsService = new TransactionsService();
