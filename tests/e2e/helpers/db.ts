import { prisma } from '../../../src/database/database.service';

/**
 * Utility to provide access to the real database layer during E2E testing.
 */
export function getDbClient() {
  return prisma;
}

/**
 * Truncates all relevant tables to ensure a clean state for E2E tests.
 */
export async function clearDatabase() {
  const tableNames = [
    'trusted_issuers',
    'agents',
    'claims',
    'balances',
    'transactions',
    'wallets',
    'investors',
    'events',
    'tokens', // TokenConfig
  ];

  for (const tableName of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    } catch (error) {
       console.error(`Failed to truncate ${tableName}:`, (error as Error).message);
    }
  }
}
