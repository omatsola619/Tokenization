import { prisma } from '../../src/database/database.service';
import { indexerService } from '../../src/workers/indexer.service';
import { runTxWorker } from '../../src/workers/tx.worker';

beforeAll(async () => {
  // This file runs before every test file. Use a process-level global so the
  // cleanup + worker startup only happens once for the entire e2e run, not once
  // per file (module-level variables reset between test files).
  if ((global as any).__e2e_setup_done) return;
  (global as any).__e2e_setup_done = true;

  // Clean DB once before the entire run so flows start from a known state.
  // Delete in FK-safe order: dependents first, then parents.
  await prisma.transaction.deleteMany();
  await prisma.event.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.balance.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.investor.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.trustedIssuer.deleteMany();
  await prisma.tokenConfig.deleteMany();

  await indexerService.start();
  await runTxWorker();
  await new Promise(resolve => setTimeout(resolve, 1000));
});
