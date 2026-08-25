import type { NextFunction, Request, RequestHandler, Response } from "express";
import { pool } from "./db";

export type AiUsageLimitOptions = {
  feature: string;
  windowMs: number;
  max: number;
  message: string;
};

export type AiUsageSlotResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

let aiUsageTableReady: Promise<void> | undefined;

/**
 * Request counters live in PostgreSQL rather than process memory so quota
 * enforcement survives restarts and is shared across autoscaled instances.
 */
export function ensureAiUsageLimitTable(): Promise<void> {
  aiUsageTableReady ??= (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "ai_usage_limits" (
        "account_id" varchar NOT NULL,
        "feature" varchar(100) NOT NULL,
        "window_started_at" timestamptz NOT NULL,
        "request_count" integer NOT NULL DEFAULT 0 CHECK ("request_count" >= 0),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY ("account_id", "feature", "window_started_at")
      );
    `);
  })().catch((error) => {
    aiUsageTableReady = undefined;
    throw error;
  });
  return aiUsageTableReady;
}

function authenticatedAccountId(req: Request): string | undefined {
  const accountId = (req as any).currentUser?.id || (req.user as any)?.claims?.sub;
  return typeof accountId === "string" && accountId.length > 0 ? accountId : undefined;
}

function usageWindow(now: Date, windowMs: number): { startedAt: Date; resetAt: Date } {
  const startedAtMs = Math.floor(now.getTime() / windowMs) * windowMs;
  return { startedAt: new Date(startedAtMs), resetAt: new Date(startedAtMs + windowMs) };
}

/** Atomically consume one quota slot only if this account remains under its cap. */
export async function consumeAiUsageSlot(
  accountId: string,
  options: AiUsageLimitOptions,
  now = new Date(),
): Promise<AiUsageSlotResult> {
  await ensureAiUsageLimitTable();
  const { startedAt, resetAt } = usageWindow(now, options.windowMs);
  const result = await pool.query<{ request_count: number }>(
    `
      INSERT INTO "ai_usage_limits" ("account_id", "feature", "window_started_at", "request_count", "updated_at")
      VALUES ($1, $2, $3, 1, now())
      ON CONFLICT ("account_id", "feature", "window_started_at")
      DO UPDATE SET
        "request_count" = "ai_usage_limits"."request_count" + 1,
        "updated_at" = now()
      WHERE "ai_usage_limits"."request_count" < $4
      RETURNING "request_count";
    `,
    [accountId, options.feature, startedAt, options.max],
  );
  const count = result.rows[0]?.request_count;
  return count === undefined
    ? { allowed: false, remaining: 0, resetAt }
    : { allowed: true, remaining: Math.max(0, options.max - count), resetAt };
}

export function createAiUsageLimiter(
  options: AiUsageLimitOptions,
  consumeSlot: typeof consumeAiUsageSlot = consumeAiUsageSlot,
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const accountId = authenticatedAccountId(req);
    if (!accountId) return res.status(401).json({ message: "Unauthorized" });

    try {
      const usage = await consumeSlot(accountId, options);
      res.setHeader("X-AI-Usage-Limit", String(options.max));
      res.setHeader("X-AI-Usage-Remaining", String(usage.remaining));
      res.setHeader("X-AI-Usage-Reset", usage.resetAt.toISOString());
      if (!usage.allowed) {
        return res.status(429).json({
          message: `${options.message} Please try again after ${usage.resetAt.toISOString()}.`,
          code: "AI_USAGE_LIMIT_REACHED",
          resetAt: usage.resetAt.toISOString(),
        });
      }
      return next();
    } catch (error: any) {
      console.error("AI usage quota check failed:", error?.message || error);
      // Fail closed: never permit a paid model call if its quota cannot be checked.
      return res.status(503).json({ message: "AI usage is temporarily unavailable. Please try again shortly." });
    }
  };
}
