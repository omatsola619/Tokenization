import { clearDatabase } from './tests/e2e/helpers/db';

export default async () => {
  console.log('🚀 Global E2E Setup: Clearing database...');
  await clearDatabase();
  console.log('✅ Database cleared.');
};
