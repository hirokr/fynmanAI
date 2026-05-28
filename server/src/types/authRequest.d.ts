import { Request, Response } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  sessionId?: string;
  file?: Express.Multer.File;
}

export type Response = Response;
