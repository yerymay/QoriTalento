import type { Request, Response } from 'express';
import { SystemService } from '../services/system.service.js';

// Capa 1: solo HTTP, sin SQL ni reglas de negocio.
export class SystemController {
  constructor(private readonly service: SystemService) {}

  health = (_req: Request, res: Response): void => {
    res.status(200).json(this.service.getHealth());
  };

  dbCheck = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json(await this.service.getDatabaseStatus());
    } catch {
      res.status(503).json({
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'La base de datos no está disponible',
          request_id: res.locals.requestId,
        },
      });
    }
  };
}
