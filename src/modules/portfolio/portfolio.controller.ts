import { Request, Response, NextFunction } from 'express';
import { portfolioService } from './portfolio.service';

export class PortfolioController {
  async getByWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const { wallet } = req.params;
      const result = await portfolioService.getByWallet(wallet);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const portfolioController = new PortfolioController();
