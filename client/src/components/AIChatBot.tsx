import { useState, useRef, useEffect } from "react";
import { Send, Loader2, ChevronDown, Sparkles, Bot, Headset } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { safeModelTextForDisplay } from "@/lib/safe-model-output";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AIChatBot() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const SUGGESTED_PROMPTS = [
    t("chat_suggestion_1"),
    t("chat_suggestion_2"),
    t("chat_suggestion_3"),
    t("chat_suggestion_4"),
  ];
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setHasUnread(false);
    }
  }, [open]);

  const sendMessage = async (text: string) => {
    const userText = text.trim();
    if (!userText || streaming) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Placeholder for streaming response
    setMessages([...newMessages, { role: "assistant", content: "" }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: newMessages,
        }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.content) {
              fullContent = safeModelTextForDisplay(`${fullContent}${parsed.content}`);
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: fullContent };
                return updated;
              });
            }
          } catch {}
        }
      }

      // Mark unread if chat is closed
      if (!open) setHasUnread(true);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: t("chat_error"),
          };
          return updated;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    if (streaming) abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setStreaming(false);
  };

  const talkToLiveAgent = () => {
    if (streaming) abortRef.current?.abort();
    const target = user?.role === "ADMIN" ? "/admin/messages" : "/messages";
    setOpen(false);
    setLocation(target);
  };

  if (!user?.role) return null;

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6">
        <AnimatePresence>
          {!open && (
            <motion.button
              key="chat-btn"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              onClick={() => setOpen(true)}
              data-testid="button-open-chatbot"
              className="relative flex items-center justify-center w-14 h-14 text-[#6FFFE9] hover:text-[#9DEFE4] transition-colors drop-shadow-lg"
              aria-label={t("chat_open_aria")}
            >
              {/* Chat bubble with AI text */}
              <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 7C4 5.34315 5.34315 4 7 4H31C32.6569 4 34 5.34315 34 7V25C34 26.6569 32.6569 28 31 28H11L4 34V7Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                  fill="none"
                />
                <text
                  x="19"
                  y="20"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="currentColor"
                  fontSize="9"
                  fontWeight="700"
                  fontFamily="Inter, system-ui, sans-serif"
                  letterSpacing="0.5"
                >{t("chat_floating_label")}</text>
              </svg>
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full border-2 border-[#6FFFE9]" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed bottom-24 right-4 z-50 w-[calc(100vw-32px)] max-w-sm md:bottom-6 md:right-6 flex flex-col"
            style={{
              height: "min(520px, calc(100dvh - 140px))",
              background: "var(--surface-card, #0a0a0a)",
              border: "1px solid rgba(111,255,233,0.2)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(111,255,233,0.06)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#6FFFE9]/15 flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-[#6FFFE9]/10 border border-[#6FFFE9]/25">
                <Sparkles size={16} className="text-[#6FFFE9]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-tight">{t("chat_assistant_title")}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{t("chat_assistant_subtitle")}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={talkToLiveAgent}
                  className="flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-widest text-[#6FFFE9] border border-[#6FFFE9]/30 hover:bg-[#6FFFE9]/10 hover:border-[#6FFFE9]/60 transition-colors"
                  data-testid="button-talk-to-live-agent"
                  title={t("chat_live_title")}
                >
                  <Headset size={12} />
                  <span className="hidden sm:inline">{t("chat_live")}</span>
                </button>
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-1.5 text-zinc-500 hover:text-white transition-colors text-[10px] uppercase tracking-widest"
                    data-testid="button-clear-chat"
                  >
                    {t("chat_clear")}
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                  data-testid="button-close-chatbot"
                  aria-label={t("chat_close_aria")}
                >
                  <ChevronDown size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
              {messages.length === 0 && (
                <div className="space-y-5">
                  <div className="text-center pt-2">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-[#6FFFE9]/10 border border-[#6FFFE9]/20 mb-3">
                      <Bot size={22} className="text-[#6FFFE9]" />
                    </div>
                    <p className="text-sm text-zinc-300 font-medium">{t("chat_how_help")}</p>
                    <p className="text-xs text-zinc-600 mt-1">{t("chat_ask_anything")}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {SUGGESTED_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="text-left px-3 py-2.5 text-xs text-zinc-400 border border-zinc-800 hover:border-[#6FFFE9]/40 hover:text-[#9DEFE4] hover:bg-[#6FFFE9]/5 transition-all"
                        data-testid={`suggestion-${prompt.slice(0, 20)}`}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                  <div className="pt-2 border-t border-zinc-800/80">
                    <button
                      onClick={talkToLiveAgent}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-[#6FFFE9] border border-[#6FFFE9]/30 hover:bg-[#6FFFE9]/10 hover:border-[#6FFFE9]/60 transition-all uppercase tracking-widest"
                      data-testid="button-talk-to-live-agent-empty"
                    >
                      <Headset size={14} />
                      {t("chat_talk_to_live")}
                    </button>
                    <p className="text-[10px] text-zinc-600 mt-2 text-center">
                      {t("chat_need_human")}
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 mr-2 flex-shrink-0 mt-0.5 flex items-center justify-center bg-[#6FFFE9]/10 border border-[#6FFFE9]/20">
                      <Sparkles size={11} className="text-[#6FFFE9]" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-3 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#6FFFE9] text-black font-medium"
                        : "bg-zinc-900 text-zinc-200 border border-zinc-800"
                    }`}
                    data-testid={`chat-message-${msg.role}-${i}`}
                  >
                    {safeModelTextForDisplay(msg.content) || (
                      msg.role === "assistant" && streaming && i === messages.length - 1 ? (
                        <span className="flex items-center gap-1.5 text-zinc-500">
                          <Loader2 size={12} className="animate-spin" />
                          <span className="text-xs">{t("chat_thinking")}</span>
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              ))}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-zinc-800/80 px-3 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("chat_placeholder")}
                  rows={1}
                  className="flex-1 resize-none bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-600 px-3 py-2.5 focus:outline-none focus:border-[#6FFFE9]/40 transition-colors min-h-[40px] max-h-[100px]"
                  style={{ scrollbarWidth: "none" }}
                  disabled={streaming}
                  data-testid="input-chatbot"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || streaming}
                  className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#6FFFE9] text-black hover:bg-[#9DEFE4] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  data-testid="button-send-chat"
                  aria-label={t("chat_send_aria")}
                >
                  {streaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              <p className="text-[9px] text-zinc-700 mt-1.5 text-center uppercase tracking-widest">
                {t("chat_disclaimer")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
