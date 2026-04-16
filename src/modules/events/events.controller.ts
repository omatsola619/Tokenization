import { Request, Response, NextFunction } from 'express';
import { eventsService } from './events.service';

export class EventsController {
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await eventsService.getStatus();
      return res.status(200).json(status);
    } catch (error) {
      next(error);
    }
  }

  async resync(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await eventsService.resync();
      return res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const eventsController = new EventsController();
