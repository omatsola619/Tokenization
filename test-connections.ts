import { prisma } from './src/database/database.service';
import { blockchainService } from './src/services/blockchain.service';

async function main() {
  console.log("== Testing Database Connection ==");
  try {
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log("✅ Database connection successful:", result);
  } catch (error: any) {
    console.error("❌ Failed to connect to the database:");
    console.error(error.message);
  }

  console.log("\n== Testing Blockchain Connection ==");
  try {
    const blockNumber = await blockchainService.getPublicClient().getBlockNumber();
    console.log("✅ Blockchain connection successful! Current block number:", blockNumber);
  } catch (error: any) {
    console.error("❌ Failed to connect to the blockchain:");
    console.error(error.message);
  }

  await prisma.$disconnect();
}

main();
