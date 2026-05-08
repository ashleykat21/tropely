import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

export interface AuthedRequest extends Request {
  userId: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as AuthedRequest).userId = userId;
  next();
}

export function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
