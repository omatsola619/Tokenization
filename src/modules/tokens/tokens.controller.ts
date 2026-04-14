import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../common/response';
import { tokensService } from './tokens.service';

export class TokensController {
  async mint(req: Request, res: Response, next: NextFunction) {
    try {
      const { wallet, amount } = req.body;
      if (!amount) return res.status(400).json({ error: 'amount is required' });
      
      const result = await tokensService.mint(wallet, amount);
      return res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async batchMint(req: Request, res: Response, next: NextFunction) {
    try {
      const { recipients } = req.body;
      const result = await tokensService.batchMint(recipients);
      return res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async burn(req: Request, res: Response, next: NextFunction) {
    try {
      const { wallet, amount } = req.body;
      const result = await tokensService.burn(wallet, amount);
      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async transfer(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, amount } = req.body;
      if (!from || !to || !amount) return res.status(400).json({ error: 'fields missing' });
      
      const result = await tokensService.transfer(from, to, amount);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async batchTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const { transfers } = req.body;
      const result = await tokensService.batchTransfer(transfers);
      return res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async simulateTransfer(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, amount } = req.body;
      const result = await tokensService.simulateTransfer(from, to, amount);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deploy(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, symbol, decimals, complianceModule } = req.body;
      if (!name || !symbol || !decimals) return res.status(400).json({ error: 'missing fields' });
      const result = await tokensService.deploy(name, symbol, decimals, complianceModule);
      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tokensService.getConfig();
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { wallet } = req.params;
      const balance = await tokensService.getBalance(wallet);
      return res.status(200).json({ wallet, balance });
    } catch (error) {
      next(error);
    }
  }

  async getPortfolio(req: Request, res: Response, next: NextFunction) {
    try {
      const { wallet } = req.params;
      const result = await tokensService.getPortfolio(wallet);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const tokensController = new TokensController();
