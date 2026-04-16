import { Request, Response, NextFunction } from 'express';
import { jobsService } from './jobs.service';

export class JobsController {
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const status = await jobsService.getStatus(id);
      return res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  }
}

export const jobsController = new JobsController();
