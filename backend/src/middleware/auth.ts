import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/token";

export interface AuthedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "unauthorized", message: "Missing access token" });
  }
  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    return res.status(401).json({ error: "unauthorized", message: "Invalid or expired token" });
  }
}
