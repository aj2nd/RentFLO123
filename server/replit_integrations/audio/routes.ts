import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { chatStorage } from "../chat/storage";
import { detectAudioFormat, openai, speechToText, ensureCompatibleFormat } from "./client";
import { isAuthenticated } from "../auth";
import { authStorage } from "../auth/storage";
import { z } from "zod";
import { conversationIdParamsSchema, sanitizedText, validateRequest } from "../../input-validation";
import { decodeStrictBase64, MAX_AUDIO_UPLOAD_BYTES, UploadValidationError } from "../../upload-validation";
import { legacyChatMessageResponse, legacyConversationResponse } from "../../response-serializers";
import { createAiUsageLimiter } from "../../ai-usage-limit";
import {
  AUDIO_SYSTEM_INSTRUCTIONS,
  buildUntrustedConversationPrompt,
  sanitizeModelOutputText,
  type UntrustedConversationTurn,
} from "../../ai-security";

// Body parser with 50MB limit for audio payloads — applied only to the audio
// route, after isAuthenticated, so unauthenticated requests never parse the body.
const audioBodyParser = express.json({ limit: "14mb" });
const legacyConversationTitleSchema = z.object({
  title: sanitizedText(1, 200).optional(),
}).strict();
const audioMessageSchema = z.object({
  audio: z.string().min(4).max(14_000_000)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/, "Audio must be valid base64")
    .refine((value) => Buffer.byteLength(value, "base64") <= MAX_AUDIO_UPLOAD_BYTES, "Audio must be 10 MB or smaller"),
  voice: z.enum(["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse"]).default("alloy"),
}).strict();
const legacyVoiceChatDailyUsageLimiter = createAiUsageLimiter({
  feature: "legacy_voice_chat",
  windowMs: 24 * 60 * 60 * 1000,
  max: 10,
  message: "Your daily voice assistant limit has been reached.",
});

// The legacy conversation schema has no participant ownership. Restrict it to
// verified admins until a user-owned conversation migration is completed.
async function requireLegacyConversationAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.claims?.sub;
  const user = userId ? await authStorage.getUser(userId) : null;
  if (!user || user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  return next();
}

export function registerAudioRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", isAuthenticated, requireLegacyConversationAdmin, async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations.map(legacyConversationResponse));
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", isAuthenticated, requireLegacyConversationAdmin, validateRequest({ params: conversationIdParamsSchema }), async (req: Request, res: Response) => {
    try {
      const id = (req.params as any).id as number;
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...legacyConversationResponse(conversation), messages: messages.map(legacyChatMessageResponse) });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", isAuthenticated, requireLegacyConversationAdmin, validateRequest({ body: legacyConversationTitleSchema }), async (req: Request, res: Response) => {
    try {
      const { title } = req.body as z.infer<typeof legacyConversationTitleSchema>;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(legacyConversationResponse(conversation));
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", isAuthenticated, requireLegacyConversationAdmin, validateRequest({ params: conversationIdParamsSchema }), async (req: Request, res: Response) => {
    try {
      const id = (req.params as any).id as number;
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send voice message and get streaming audio response
  // Auto-detects audio format and converts WebM/MP4/OGG to WAV
  // Uses gpt-4o-mini-transcribe for STT, gpt-audio for voice response
  // isAuthenticated runs BEFORE audioBodyParser so the 50 MB body is never
  // parsed for unauthenticated requests.
  app.post("/api/conversations/:id/messages", isAuthenticated, requireLegacyConversationAdmin, audioBodyParser, validateRequest({ params: conversationIdParamsSchema, body: audioMessageSchema }), legacyVoiceChatDailyUsageLimiter, async (req: Request, res: Response) => {
    try {
      const conversationId = (req.params as any).id as number;
      const { audio, voice } = req.body as z.infer<typeof audioMessageSchema>;

      // 1. Auto-detect format and convert to OpenAI-compatible format
      let rawBuffer: Buffer;
      try {
        rawBuffer = decodeStrictBase64(audio, MAX_AUDIO_UPLOAD_BYTES);
      } catch (error) {
        if (error instanceof UploadValidationError) {
          return res.status(400).json({ error: error.message });
        }
        throw error;
      }
      if (detectAudioFormat(rawBuffer) === "unknown") {
        return res.status(400).json({ error: "Audio must be a supported WebM, MP4, WAV, MP3, or OGG recording" });
      }
      const { buffer: audioBuffer, format: inputFormat } = await ensureCompatibleFormat(rawBuffer);

      // 2. Transcribe user audio
      const userTranscript = await speechToText(audioBuffer, inputFormat);

      // 3. Save user message
      await chatStorage.createMessage(conversationId, "user", userTranscript);

      // 4. Get conversation history
      const existingMessages = await chatStorage.getMessagesByConversation(conversationId);
      const chatHistory: UntrustedConversationTurn[] = existingMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // 5. Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ type: "user_transcript", data: userTranscript })}\n\n`);

      // 6. Stream audio response from gpt-audio
      const stream = await openai.chat.completions.create({
        model: "gpt-audio",
        modalities: ["text", "audio"],
        audio: { voice, format: "pcm16" },
        messages: [
          { role: "system", content: AUDIO_SYSTEM_INSTRUCTIONS },
          { role: "user", content: buildUntrustedConversationPrompt(chatHistory, { authenticatedRole: "ADMIN" }) },
        ],
        stream: true,
      });

      let assistantTranscript = "";

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta as any;
        if (!delta) continue;

        if (delta?.audio?.transcript) {
          const transcript = sanitizeModelOutputText(delta.audio.transcript);
          assistantTranscript = sanitizeModelOutputText(`${assistantTranscript}${transcript}`);
          res.write(`data: ${JSON.stringify({ type: "transcript", data: transcript })}\n\n`);
        }

        if (delta?.audio?.data) {
          res.write(`data: ${JSON.stringify({ type: "audio", data: delta.audio.data })}\n\n`);
        }
      }

      // 7. Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", assistantTranscript);

      res.write(`data: ${JSON.stringify({ type: "done", transcript: assistantTranscript })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error processing voice message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: "error", error: "Failed to process voice message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to process voice message" });
      }
    }
  });
}
