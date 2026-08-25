import { createHmac, randomBytes } from "node:crypto";
import type { ErrorRequestHandler, Request, RequestHandler, Response } from "express";

const nativeConsole = {
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  log: console.log.bind(console),
};
const SENSITIVE_VALUE_PATTERN = /((?:api[_-]?key|authorization|bearer|cookie|password|secret|token|session|credential)\s*["']?\s*[:=]\s*["']?)([^\s,;"']+)/gi;
const SENSITIVE_KEY_PATTERN = /(api[_-]?key|authorization|bearer|cookie|password|secret|token|session|credential|access[_-]?key|private[_-]?key|account(?:[_-]?id)?|user(?:[_-]?id)?|email|network|ip(?:[_-]?address)?)/i;
const MONITORING_HASH_KEY = process.env.MONITORING_HASH_KEY || randomBytes(32).toString("hex");

type SafeLogValue = string | number | boolean | null | SafeLogValue[] | { [key: string]: SafeLogValue };

export function redactDiagnostic(value: unknown): string {
  const text = typeof value === "string" ? value : String(value || "Unknown error");
  return text.replace(SENSITIVE_VALUE_PATTERN, "$1[REDACTED]").slice(0, 4_000);
}

function safeLogValue(value: unknown, depth = 0): SafeLogValue {
  if (depth > 4) return "[TRUNCATED]";
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return redactDiagnostic(value);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactDiagnostic(value.message),
      stack: value.stack ? redactDiagnostic(value.stack) : null,
    };
  }
  if (Array.isArray(value)) return value.slice(0, 20).map((entry) => safeLogValue(entry, depth + 1));
  if (typeof value === "object") {
    const safe: Record<string, SafeLogValue> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>).slice(0, 30)) {
      safe[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : safeLogValue(entry, depth + 1);
    }
    return safe;
  }
  return redactDiagnostic(value);
}

function emitPrivateLog(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}) {
  const record = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...safeLogValue(fields) as Record<string, SafeLogValue>,
  });
  nativeConsole[level === "info" ? "log" : level](record);
}

function identifierHash(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return createHmac("sha256", MONITORING_HASH_KEY).update(value).digest("base64url").slice(0, 16);
}

function safeRoutePath(path: string): string {
  return path
    .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "/:id")
    .replace(/\/\d{3,}/g, "/:id")
    .slice(0, 240);
}

function requestContext(req: Request) {
  const accountId = (req as any).currentUser?.id || (req.user as any)?.claims?.sub;
  return {
    method: req.method,
    path: safeRoutePath(req.path),
    accountHash: identifierHash(typeof accountId === "string" ? accountId : undefined),
    networkHash: identifierHash(req.ip),
  };
}

export function logOperationalEvent(event: string, fields: Record<string, unknown> = {}) {
  emitPrivateLog("info", event, fields);
}

export function logSecurityEvent(event: string, req: Request, fields: Record<string, unknown> = {}) {
  emitPrivateLog("warn", event, { ...requestContext(req), ...fields });
}

/**
 * Production safety net for legacy direct console calls. Values are converted
 * into redacted structured records before reaching Railway stdout/stderr.
 */
export function installRedactedConsoleLogging() {
  for (const level of ["log", "warn", "error"] as const) {
    console[level] = (...args: unknown[]) => emitPrivateLog(
      level === "log" ? "info" : level,
      "legacy_console",
      { args },
    );
  }
}

function statusCode(error: any): number {
  const status = Number(error?.status || error?.statusCode);
  return Number.isInteger(status) && status >= 400 && status <= 599 ? status : 500;
}

/**
 * Private diagnostic record for Railway/server logs. Request bodies, cookies,
 * authorization headers, and provider response bodies are never attached.
 */
export function logPrivateError(event: string, error: unknown, context: Record<string, unknown> = {}) {
  const err = error instanceof Error ? error : undefined;
  emitPrivateLog("error", event, {
    ...context,
    errorName: err?.name || typeof error,
    errorMessage: redactDiagnostic(err?.message || error),
    errorStack: err?.stack ? redactDiagnostic(err.stack) : undefined,
  });
}

export function createApiMonitoringMiddleware(): RequestHandler {
  return (req, res, next) => {
    const start = Date.now();
    res.once("finish", () => {
      if (!req.path.startsWith("/api")) return;
      const durationMs = Date.now() - start;
      const context = { ...requestContext(req), status: res.statusCode, durationMs };
      logOperationalEvent("api_request_completed", context);
      if (res.statusCode === 401) logSecurityEvent("authentication_rejected", req, { status: res.statusCode });
      else if (res.statusCode === 403) logSecurityEvent("authorization_denied", req, { status: res.statusCode });
      else if (res.statusCode === 429) logSecurityEvent("rate_limit_triggered", req, { status: res.statusCode });
      else if (res.statusCode >= 500) logSecurityEvent("server_error_response", req, { status: res.statusCode, durationMs });
      if ((req.path.includes("/webhook") || req.path.includes("/cashfree/verify")) && res.statusCode >= 400) {
        logSecurityEvent("provider_callback_rejected", req, { status: res.statusCode });
      }
    });
    next();
  };
}

export function sendSafeError(res: Response, status = 500) {
  const message = status >= 500
    ? "We could not complete your request. Please try again."
    : "Request could not be completed.";
  return res.status(status).json({ message, code: status >= 500 ? "INTERNAL_ERROR" : "REQUEST_REJECTED" });
}

export const productionErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = statusCode(error);
  logPrivateError("unhandled_request_error", error, {
    method: req.method,
    path: req.path,
    status,
  });
  return sendSafeError(res, status);
};
