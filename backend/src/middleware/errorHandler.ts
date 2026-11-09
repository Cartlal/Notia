import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "validation_error", message: err.issues[0]?.message ?? "Invalid input", issues: err.issues });
  }
  console.error(err);
  return res.status(500).json({ error: "internal_error", message: "Something went wrong" });
}
