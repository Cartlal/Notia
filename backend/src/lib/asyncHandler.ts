import { NextFunction, Request, Response } from "express";

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

// Express 4 does not catch rejected promises from async handlers — an
// awaited throw (e.g. `throw new ApiError(...)`) becomes an unhandled
// rejection and crashes the whole process. Wrap every async handler with
// this so rejections are forwarded to errorHandler instead.
export function asyncHandler(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
