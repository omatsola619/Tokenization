import { indexerService } from './indexer.service';
import { prisma } from '../database/database.service';

async function main() {
  console.log('👷 Event Indexer Worker starting...');
  
  // Test DB connection
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }

  // Start the indexer
  await indexerService.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down indexer...');
    await prisma.$disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down indexer...');
    await prisma.$disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('💥 Unhandled Indexer Error:', error);
  process.exit(1);
});
