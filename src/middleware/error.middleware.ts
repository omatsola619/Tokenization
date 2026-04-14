import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';

export const errorMiddleware = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'conflict: record already exists' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'not found: record does not exist' });
    }
  }

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
};
