import { prisma } from '../../src/database/database.service';

jest.mock('../../src/services/blockchain.service', () => ({
  blockchainService: {
    registerInvestor: jest.fn().mockResolvedValue({ transactionHash: '0xmock' }),
    mintTokens: jest.fn().mockResolvedValue({ transactionHash: '0xmock' }),
    canTransfer: jest.fn().mockResolvedValue(true),
    getPublicClient: jest.fn().mockReturnValue({
      waitForTransactionReceipt: jest.fn().mockResolvedValue({ status: 'success' })
    })
  }
}));


beforeAll(async () => {
  // 1. Wipe data before each suite to guarantee isolated state
  await prisma.transaction.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.investor.deleteMany();
  await prisma.tokenConfig.deleteMany();

  // 2. Seed default data commonly expected in tests
  await prisma.tokenConfig.create({
    data: {
      address: '0xFE84407F987475f8Af7e59c2873aaBb9d1D76688', // Standard token config dummy
      name: 'Acme Security Token',
      symbol: 'ACME',
      decimals: 18,
      totalSupply: 10000n,
      isPaused: false
    }
  });

  await prisma.investor.create({
    data: {
      walletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      country: 'US',
      identityRegistered: true,
      frozen: false
    }
  });

  await prisma.investor.create({
    data: {
      walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      country: 'UK',
      identityRegistered: true,
      frozen: false
    }
  });

  await prisma.investor.create({
    data: {
      walletAddress: '0xPrimary',
      country: 'US',
      identityRegistered: true,
      frozen: false
    }
  });
});


afterAll(async () => {
  await prisma.$disconnect();
});
