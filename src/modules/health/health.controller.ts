import { Request, Response } from 'express';
import { healthService } from './health.service';

export class HealthController {
  async getApiHealth(req: Request, res: Response) {
    const health = await healthService.getApiHealth();
    return res.status(200).json(health);
  }

  async getBlockchainHealth(req: Request, res: Response) {
    const health = await healthService.getBlockchainHealth();
    return res.status(200).json(health);
  }
}

export const healthController = new HealthController();
