import type { ErrorRequestHandler, Response } from "express";

const SENSITIVE_VALUE_PATTERN = /((?:api[_-]?key|authorization|bearer|cookie|password|secret|token)\s*[:=]\s*)([^\s,;"']+)/gi;

function redactDiagnostic(value: unknown): string {
  const text = typeof value === "string" ? value : String(value || "Unknown error");
  return text.replace(SENSITIVE_VALUE_PATTERN, "$1[REDACTED]");
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
  console.error(JSON.stringify({
    level: "error",
    event,
    ...context,
    errorName: err?.name || typeof error,
    errorMessage: redactDiagnostic(err?.message || error),
    errorStack: err?.stack ? redactDiagnostic(err.stack) : undefined,
  }));
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
