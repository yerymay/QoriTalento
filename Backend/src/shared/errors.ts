import type { RequestHandler } from 'express';
export class AppError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}
export const asyncHandler = (handler: RequestHandler): RequestHandler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
