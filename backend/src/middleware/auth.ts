import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { pool } from "../db";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: string };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not logged in" });
  }
  const token = authHeader.split(" ")[1];
  try {
    req.user = verifyToken(token);
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
  try {
    const result = await pool.query(
      `select to_jsonb(u)->>'deletion_scheduled_for' as deletion_scheduled_for,
              to_jsonb(u)->>'account_deletion_completed_at' as account_deletion_completed_at
       from users u where id = $1`,
      [req.user!.userId]
    );
    const account = result.rows[0];
    if (!account || account.account_deletion_completed_at) return res.status(401).json({ error: "This account has been deleted. Please contact support if you need help." });
    if (account.deletion_scheduled_for && new Date(account.deletion_scheduled_for).getTime() <= Date.now()) {
      return res.status(403).json({ error: "The account deletion deadline has passed." });
    }
    if (account.deletion_scheduled_for) {
      const recoveryRoute = req.baseUrl === "/auth" && (
        (req.method === "GET" && req.path === "/me") ||
        (req.method === "DELETE" && req.path === "/me") ||
        (req.method === "POST" && req.path === "/me/delete/cancel")
      );
      if (!recoveryRoute) return res.status(403).json({ error: "This account is scheduled for deletion. Cancel the request from account settings to continue." });
    }
    next();
  } catch (error) {
    console.error("Account status check failed", error);
    return res.status(503).json({ error: "Could not verify your account status. Please try again." });
  }
}
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try { req.user = verifyToken(authHeader.split(" ")[1]); } catch { /* anonymous browsing remains available */ }
  }
  next();
}
