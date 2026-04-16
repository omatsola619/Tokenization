import { Router } from 'express';
import { portfolioController } from './portfolio.controller';

const router = Router();

router.get('/:wallet', portfolioController.getByWallet);

export default router;
