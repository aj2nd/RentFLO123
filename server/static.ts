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

  // Serve static files first (.well-known, images, etc.)
  app.use(express.static(distPath));

  // SPA fallback using regex (required by newer path-to-regexp)
  app.get(/.*/, (req, res) => {
    // Protect .well-known paths (assetlinks.json)
    if (req.path.startsWith("/.well-known/")) {
      return res.status(404).json({ message: "Not found" });
    }

    // Don't intercept API routes
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "Not found" });
    }

    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
