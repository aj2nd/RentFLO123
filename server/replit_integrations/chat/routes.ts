import type { Express, NextFunction, Request, Response } from "express";
import OpenAI from "openai";
import { chatStorage } from "./storage";
import { isAuthenticated } from "../auth";
import { authStorage } from "../auth/storage";
import { z } from "zod";
import { conversationIdParamsSchema, sanitizedText, validateRequest } from "../../input-validation";
import { legacyChatMessageResponse, legacyConversationResponse } from "../../response-serializers";

const conversationTitleSchema = z.object({
  title: sanitizedText(1, 200).optional(),
}).strict();
const conversationMessageSchema = z.object({
  content: sanitizedText(1, 4000),
}).strict();

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

// Legacy conversations have no user/participant ownership column. Until that
// schema is migrated, restrict this dormant module to verified administrators.
async function requireLegacyConversationAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.claims?.sub;
  const user = userId ? await authStorage.getUser(userId) : null;
  if (!user || user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  return next();
}

export function registerChatRoutes(app: Express): void {
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
  app.post("/api/conversations", isAuthenticated, requireLegacyConversationAdmin, validateRequest({ body: conversationTitleSchema }), async (req: Request, res: Response) => {
    try {
      const { title } = req.body as z.infer<typeof conversationTitleSchema>;
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

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", isAuthenticated, requireLegacyConversationAdmin, validateRequest({ params: conversationIdParamsSchema, body: conversationMessageSchema }), async (req: Request, res: Response) => {
    try {
      const conversationId = (req.params as any).id as number;
      const { content } = req.body as z.infer<typeof conversationMessageSchema>;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from OpenAI
      const stream = await openai.chat.completions.create({
        model: "gpt-5.4",
        messages: chatMessages,
        stream: true,
        max_completion_tokens: 8192,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      // Save assistant message
      await chatStorage.createMessage(conversationId, "assistant", fullResponse);

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error) {
      console.error("Error sending message:", error);
      // Check if headers already sent (SSE streaming started)
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}
