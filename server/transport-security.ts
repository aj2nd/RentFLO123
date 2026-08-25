import type { NextFunction, Request, Response } from "express";

export type HttpsRedirectOptions = {
  production: boolean;
  publicAppUrl?: string;
};

function trustedHttpsOrigin(publicAppUrl?: string): string {
  const configured = publicAppUrl || "https://rentflo.in";
  try {
    const url = new URL(configured);
    if (url.protocol === "https:" && !url.username && !url.password) return url.origin;
  } catch {
    // Fall through to the known production canonical origin.
  }
  return "https://rentflo.in";
}

/**
 * Railway terminates TLS at its edge and forwards the original protocol through
 * X-Forwarded-Proto. With Express `trust proxy` configured for that one proxy,
 * `req.secure` safely reflects whether the public request was HTTPS. Redirect
 * targets are built from the configured canonical HTTPS origin, never Host.
 */
export function createHttpsRedirectMiddleware(options: HttpsRedirectOptions) {
  const canonicalOrigin = trustedHttpsOrigin(options.publicAppUrl);
  return (req: Request, res: Response, next: NextFunction) => {
    if (!options.production || req.secure || req.path === "/health") return next();
    const requestedPath = req.originalUrl.startsWith("/") ? req.originalUrl : "/";
    return res.redirect(308, `${canonicalOrigin}${requestedPath}`);
  };
}
