import { Router } from 'express';
import { jobsController } from './jobs.controller';

const router = Router();

router.get('/:id', jobsController.getStatus);

export default router;
