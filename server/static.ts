import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static files first
  app.use(express.static(distPath));

  // Explicitly serve assetlinks.json for Android App Links (Deep Linking)
  app.get("/.well-known/assetlinks.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    
    const assetlinksPath = path.resolve(distPath, ".well-known/assetlinks.json");
    
    if (fs.existsSync(assetlinksPath)) {
      res.sendFile(assetlinksPath);
    } else {
      // Fallback with correct JSON if file not found in build
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
    }
  });

  // SPA fallback using regex (required by newer path-to-regexp)
  app.get(/.*/, (req, res) => {
    if (req.path.startsWith("/.well-known/")) {
      return res.status(404).json({ message: "Not found" });
    }
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "Not found" });
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
