import { Router } from 'express';
import { investorsController } from './investors.controller';
import { auth } from '../../middleware/auth.middleware';
import { portfolioController } from '../portfolio/portfolio.controller';

const router = Router();

router.post('/investors/register', investorsController.register);
router.get('/investors/:wallet', investorsController.getProfile);
router.get('/investors/:wallet/portfolio', portfolioController.getByWallet);
router.post('/investors/link-wallet', auth('issuer'), investorsController.linkWallet);
router.post('/investors/unlink-wallet', auth('issuer'), investorsController.unlinkWallet);
router.post('/investors/revoke', auth('issuer'), investorsController.revoke);

export { router as investorRouter };
