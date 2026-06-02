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

  // Serve static files first (this includes .well-known/, images, fonts, etc.)
  app.use(express.static(distPath));

  // SPA fallback - only for GET requests
  app.get("*", (req, res) => {
    // Protect .well-known paths (assetlinks.json, etc.)
    if (req.path.startsWith("/.well-known/")) {
      return res.status(404).json({ message: "Not found" });
    }

    // Don't intercept API routes
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "Not found" });
    }

    // Serve index.html for all other client routes
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
