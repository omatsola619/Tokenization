import { indexerService } from '../../src/workers/indexer.service';
import { runTxWorker } from '../../src/workers/tx.worker';

// Track if workers are already started to avoid duplicates in the same process
let workersStarted = false;

beforeAll(async () => {
  if (!workersStarted) {
    await indexerService.start();
    await runTxWorker();
    workersStarted = true;
    // Small delay to ensure workers are up
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
});
