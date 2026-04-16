import dotenv from 'dotenv';
dotenv.config();
import { app } from './app';
import { IndexerService } from './workers/indexer.service';
import { runTxWorker } from './workers/tx.worker';

console.log("DATABASE_URL:", process.env.DATABASE_URL);

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`🚀 ERC-3643 Tokenization Backend running at http://localhost:${PORT}`);
  console.log(`📌 API Base URL: http://localhost:${PORT}/api/v1`);
  
  // Start background workers
  console.log(`⛓️  Starting Event Indexer...`);
  const indexer = new IndexerService();
  indexer.start(); // This runs in its own interval loop

  console.log(`📦 Starting Transaction Worker...`);
  runTxWorker().catch(err => console.error('❌ Transaction Worker failed:', err));

  console.log(`✅ System fully operational!`);
});
