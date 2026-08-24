import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { Request } from "express";

function accountOrIpKey(req: Request): string {
  const accountId = (req as any).currentUser?.id || (req.user as any)?.claims?.sub;
  if (typeof accountId === "string" && accountId.length > 0) {
    return `account:${accountId}`;
  }
  // Handles IPv6 subnet normalization correctly; never trust a client header.
  return `ip:${ipKeyGenerator(req.ip || "0.0.0.0")}`;
}

export function createAccountRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: accountOrIpKey,
    message: { message: options.message },
  });
}
