import type { Express, Request, Response } from "express";
import { openai } from "./client";
import { isAuthenticated } from "../auth";

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { prompt, size = "1024x1024" } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }
      if (prompt.length > 1000) {
        return res.status(400).json({ error: "Prompt must be under 1000 characters" });
      }
      const ALLOWED_SIZES = ["256x256", "512x512", "1024x1024"];
      if (!ALLOWED_SIZES.includes(size)) {
        return res.status(400).json({ error: "Invalid size" });
      }

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: size as "1024x1024" | "512x512" | "256x256",
      });

      const imageData = response.data?.[0];
      res.json({
        url: imageData?.url,
        b64_json: imageData?.b64_json,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });
}

