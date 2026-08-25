import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { blockProductionArtifactMiddleware } from "./production-exposure";

const NON_INDEXABLE_APP_ROUTE_PREFIXES = [
  "/admin",
  "/owner",
  "/tenant",
  "/ledger",
  "/verify",
  "/agreement",
  "/messages",
  "/maintenance",
  "/profile",
  "/notifications",
  "/onboarding",
  "/setup",
];

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `[static] Could not find the build directory: ${distPath}. ` +
      `Make sure to run 'npm run build' before starting in production. ` +
      `Skipping static file serving — API routes will still work.`
    );
    return;
  }

  // Must precede both express.static and SPA fallback. It turns requests for
  // source maps or repository metadata into a real 404 rather than index.html.
  app.use(blockProductionArtifactMiddleware);

  app.use(
    express.static(distPath, {
      // Disable Express's automatic ETag and Last-Modified generation.
      // We own all caching semantics via explicit Cache-Control headers below;
      // having both ETags and Cache-Control in play can confuse CDN/proxy layers
      // into serving stale conditional responses after a new deploy.
      etag: false,
      lastModified: false,
      setHeaders: (res, filePath) => {
        // Hashed bundles (Vite emits /assets/[name]-[hash].ext) never change → cache forever.
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (filePath.endsWith("robots.txt") || filePath.endsWith("sitemap.xml")) {
          // Crawlers must be able to retrieve these very small discovery files reliably.
          // A short shared cache avoids forcing every crawler fetch through a cold app origin.
          res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
        } else if (filePath.endsWith("index.html") || filePath.endsWith("sw.js")) {
          // HTML shell + service worker must always revalidate so deploys land immediately.
          // Pragma covers HTTP/1.0 proxies.
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          res.setHeader("Pragma", "no-cache");
        } else {
          // Any other static asset (fonts, favicons, manifests etc.) — revalidate.
          res.setHeader("Cache-Control", "no-cache, must-revalidate");
        }
      },
    }),
  );

  // === ANDROID APP LINKS - SERVED DIRECTLY (RELIABLE) ===
  app.get("/.well-known/assetlinks.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    
    res.status(200).json([
      {
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target": {
          "namespace": "android_app",
          "package_name": "co.median.android.krokxbl",
          "sha256_cert_fingerprints": [
            "5eeabb8165e21a01a7b6ebfffc4d741b7bb986a5df1361e01140748c3e379454"
          ]
        }
      }
    ]);
  });

  // SPA fallback
  app.get(/.*/, (req, res) => {
    if (req.path.startsWith("/.well-known/")) {
      return res.status(404).json({ message: "Not found" });
    }
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "Not found" });
    }
    if (NON_INDEXABLE_APP_ROUTE_PREFIXES.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`))) {
      // App-only views are useful after authentication but are not public landing pages.
      // This header overrides the common HTML shell's indexable root-page meta tag.
      res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
    }
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
