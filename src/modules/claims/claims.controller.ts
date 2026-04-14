import { Request, Response, NextFunction } from 'express';
import { successResponse } from '../../common/response';
import { claimsService } from './claims.service';

export class ClaimsController {
  async issue(req: Request, res: Response, next: NextFunction) {
    try {
      const { wallet, topic, claimId, issuer } = req.body;
      const id = claimId || `claim_${Date.now()}`;
      const claim = await claimsService.issue(wallet, topic, id, issuer);
      return successResponse(res, claim, 201);
    } catch (error) {
      next(error);
    }
  }

  async revoke(req: Request, res: Response, next: NextFunction) {
    try {
      const { wallet, topic } = req.body;
      const result = await claimsService.revoke(wallet, topic);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getClaimsByWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const { wallet } = req.params;
      const claims = await claimsService.getClaims(wallet);
      return res.status(200).json(claims);
    } catch (error) {
      next(error);
    }
  }

  async addTopic(req: Request, res: Response, next: NextFunction) {
    try {
      // Stubbed as we are using a hardcoded list for now
      return res.status(201).json({ status: 'ok', info: 'Topic management handled via config' });
    } catch (error) {
      next(error);
    }
  }

  async getTopics(req: Request, res: Response, next: NextFunction) {
    try {
      const topics = await claimsService.getTopics();
      return res.status(200).json({ topics });
    } catch (error) {
      next(error);
    }
  }
}

export const claimsController = new ClaimsController();
