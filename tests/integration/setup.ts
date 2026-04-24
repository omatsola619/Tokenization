import { prisma } from '../../src/database/database.service';
process.env.SKIP_SYNC_WAIT = 'true';

jest.mock('../../src/services/blockchain.service', () => ({
  blockchainService: {
    // --- Existing ---
    registerInvestor: jest.fn().mockResolvedValue({ transactionHash: '0xmock_register' }),
    mintTokens: jest.fn().mockResolvedValue({ transactionHash: '0xmock_mint' }),
    canTransfer: jest.fn().mockResolvedValue([true, 0]),
    getPublicClient: jest.fn().mockReturnValue({
      waitForTransactionReceipt: jest.fn().mockResolvedValue({ status: 'success' }),
      getBlockNumber: jest.fn().mockResolvedValue(BigInt(42)),
      getChainId: jest.fn().mockResolvedValue(31337),
    }),
    // --- Phase 1: Burn ---
    burnTokens: jest.fn().mockResolvedValue({ transactionHash: '0xmock_burn' }),
    // --- Phase 2: Compliance ---
    freezeAddress: jest.fn().mockResolvedValue({ transactionHash: '0xmock_freeze' }),
    freezePartialTokens: jest.fn().mockResolvedValue({ transactionHash: '0xmock_freeze_partial' }),
    unfreezePartialTokens: jest.fn().mockResolvedValue({ transactionHash: '0xmock_unfreeze_partial' }),
    isFrozen: jest.fn().mockResolvedValue(false),
    getFrozenTokens: jest.fn().mockResolvedValue(BigInt(0)),
    // --- Phase 2: Admin ---
    forceTransfer: jest.fn().mockResolvedValue({ transactionHash: '0xmock_force' }),
    pauseToken: jest.fn().mockResolvedValue({ transactionHash: '0xmock_pause' }),
    unpauseToken: jest.fn().mockResolvedValue({ transactionHash: '0xmock_unpause' }),
    isPaused: jest.fn().mockResolvedValue(false),
  }
}));

// Mock queue service to avoid needing Redis in integration tests
jest.mock('../../src/services/queue.service', () => ({
  addTxJob: jest.fn().mockResolvedValue('mock-job-id'),
  getJobStatus: jest.fn().mockResolvedValue({
    jobId: 'mock-job-id',
    type: 'mint',
    state: 'completed',
    result: { txHash: '0xmock' },
  }),
  txQueue: { 
    add: jest.fn(),
    getJob: jest.fn().mockResolvedValue(null), // waitForJobAndSync checks this; null = skip waiting
  },
  txQueueEvents: {},
  redisConnection: {},
}));


beforeAll(async () => {
  // 1. Wipe data before each suite to guarantee isolated state
  await prisma.event.deleteMany();
  await prisma.balance.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.investor.deleteMany();
  await prisma.tokenConfig.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.trustedIssuer.deleteMany();

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

  // Seeded investors for various test suites
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

  // Seed investors for claims, compliance, portfolio, and transfer tests
  await prisma.investor.create({
    data: {
      walletAddress: '0xInvestorA',
      country: 'GB',
      identityAddress: '0xInvestorA', // Required by ClaimsService.issue
      identityRegistered: true,
      frozen: false
    }
  });

  await prisma.investor.create({
    data: {
      walletAddress: '0xInvestorB',
      country: 'US',
      identityRegistered: true,
      frozen: false
    }
  });

  // Seed a transaction for the transactions test
  await prisma.transaction.create({
    data: {
      txHash: '0xSomeTxHash',
      from: '0xInvestorA',
      to: '0xInvestorB',
      amount: BigInt(100),
      type: 'transfer',
      status: 'confirmed'
    }
  });
});


afterAll(async () => {
  await prisma.$disconnect();
});
