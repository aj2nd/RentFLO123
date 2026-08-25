import type { Express, Request, Response } from "express";
import { openai } from "./client";
import { isAuthenticated } from "../auth";
import { z } from "zod";
import { sanitizedText, validateRequest } from "../../input-validation";
import { buildImageGenerationPrompt } from "../../ai-security";

const imageGenerationSchema = z.object({
  prompt: sanitizedText(1, 1000),
  size: z.enum(["256x256", "512x512", "1024x1024"]).default("1024x1024"),
}).strict();

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", isAuthenticated, validateRequest({ body: imageGenerationSchema }), async (req: Request, res: Response) => {
    try {
      const { prompt, size } = req.body as z.infer<typeof imageGenerationSchema>;

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt: buildImageGenerationPrompt(prompt),
        n: 1,
        size,
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
