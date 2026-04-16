import { Router } from 'express';
import { transactionsController } from './transactions.controller';

const router = Router();

router.get('/transactions/:txHash', transactionsController.getByHash);
router.get('/transactions', transactionsController.getByWallet);
router.get('/jobs/:jobId', transactionsController.getJob);

export { router as transactionsRouter };
