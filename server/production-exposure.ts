import type { NextFunction, Request, Response } from "express";

const BLOCKED_PATH_SEGMENTS = new Set([".git", ".hg", ".svn"]);

export function isBlockedProductionArtifactPath(requestPath: string): boolean {
  const path = requestPath.toLowerCase();
  if (path.endsWith(".map") || path.endsWith(".map.gz")) return true;
  const segments = path.split("/").filter(Boolean);
  return segments.some((segment) =>
    BLOCKED_PATH_SEGMENTS.has(segment) ||
    segment === ".env" ||
    segment.startsWith(".env.") ||
    segment === "@vite" ||
    segment === "vite.config.ts" ||
    segment === "vite.config.js",
  );
}

/**
 * Do not fall through to the SPA shell for sensitive build/repository paths.
 * A uniform 404 prevents both file disclosure and misleading HTML 200 responses
 * that make scanner findings difficult to interpret.
 */
export function blockProductionArtifactMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!isBlockedProductionArtifactPath(req.path)) return next();
  res.setHeader("Cache-Control", "no-store");
  return res.status(404).type("text").send("Not found");
}
