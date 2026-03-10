import { ProjectRole } from '@prisma/client';
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        role: string;
        email: string;
        name: string;
      };
      projectRole?: ProjectRole
    }
  }
}