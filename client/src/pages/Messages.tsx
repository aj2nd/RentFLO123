/** Design: Private tenant messaging retains its original flow with RentFLO violet accents. */
import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/hooks/use-i18n";
import { MessageSquare, Send, Building2, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import type { Property, Message } from "@shared/schema";

function formatTime(ts: string | Date | null) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: string | Date | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function Messages() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [showChat, setShowChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: properties = [], isLoading: propsLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties/mine"],
  });

  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const { data: msgs = [], isLoading: msgsLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedPropertyId],
    enabled: !!selectedPropertyId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const sendMutation = useMutation({
    mutationFn: (body: string) =>
      apiRequest("POST", `/api/messages/${selectedPropertyId}`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedPropertyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/badge-counts"] });
      setDraft("");
    },
  });

  const handleSend = () => {
    const text = draft.trim();
    if (!text || sendMutation.isPending || !selectedPropertyId) return;
    sendMutation.mutate(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectProperty = (propId: string) => {
    setSelectedPropertyId(propId);
    setShowChat(true);
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  type GroupedMessages = { date: string; items: Message[] }[];
  const grouped: GroupedMessages = msgs.reduce((acc: GroupedMessages, msg) => {
    const label = formatDate(msg.createdAt);
    const last = acc[acc.length - 1];
    if (last && last.date === label) {
      last.items.push(msg);
    } else {
      acc.push({ date: label, items: [msg] });
    }
    return acc;
  }, []);

  return (
    <div
      className="bg-background text-foreground flex overflow-hidden"
      style={{ height: "calc(100dvh - var(--topbar-h) - 64px - env(safe-area-inset-bottom, 0px))", minHeight: "360px" }}
    >
      {/* ── Property list sidebar ───────────────────────────────────── */}
      <aside
        className={`flex-shrink-0 border-r border-white/[0.06] flex-col bg-zinc-950 ${
          showChat ? "hidden md:flex md:w-72" : "flex w-full md:w-72"
        }`}
      >
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <h1 className="text-xs font-bold uppercase tracking-[2px] text-white/40">{t("messages_heading")}</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {propsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={18} className="animate-spin text-white/20" />
            </div>
          ) : properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
              <Building2 size={28} className="text-white/10" />
              <p className="text-xs text-white/25 leading-relaxed">{t("messages_no_properties")}</p>
            </div>
          ) : (
            properties.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectProperty(p.id)}
                data-testid={`property-thread-${p.id}`}
                className={`w-full text-left px-5 py-4 border-b border-white/[0.04] transition-colors duration-150 ${
                  selectedPropertyId === p.id
                    ? "bg-white/[0.06] border-l-2 border-l-[#8B5CF6]/50"
                    : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 w-8 h-8 flex-shrink-0 border border-white/10 flex items-center justify-center bg-black/40">
                    <Building2 size={14} className="text-white/30" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white/70 truncate leading-tight">{p.address}</p>
                    <p className="text-[10px] text-white/25 mt-0.5 font-medium tracking-wide uppercase">
                      {user?.role === "OWNER" ? t("messages_tenant_thread") : t("messages_landlord_thread")}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Chat pane ──────────────────────────────────────────────── */}
      <div className={`flex-1 flex-col min-w-0 ${!showChat ? "hidden md:flex" : "flex"}`}>
        {!selectedProperty ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-8">
            <div className="w-14 h-14 border border-white/[0.06] flex items-center justify-center">
              <MessageSquare size={24} className="text-white/10" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/30">{t("messages_select_property")}</p>
              <p className="text-xs text-white/15 mt-1">
                {t("messages_private_thread")} · {user?.role === "OWNER" ? t("messages_role_tenant") : t("messages_role_landlord")}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 sm:px-6 py-4 border-b border-white/[0.06] flex items-center gap-3 sm:gap-4 bg-zinc-950/60">
              <button
                onClick={() => setShowChat(false)}
                className="md:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/80 transition-colors"
                aria-label="Back to property list"
                data-testid="button-back-to-list"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="w-8 h-8 flex-shrink-0 border border-white/10 flex items-center justify-center bg-black/40">
                <Building2 size={14} className="text-white/30" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/80 leading-tight truncate">{selectedProperty.address}</p>
                <p className="text-[10px] text-white/25 uppercase tracking-[1.5px] font-medium mt-0.5">
                  {user?.role === "OWNER" ? t("messages_role_tenant") : t("messages_role_landlord")} · {t("messages_private_thread")}
                </p>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6" data-testid="messages-area">
              {msgsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={18} className="animate-spin text-white/20" />
                </div>
              ) : msgs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <MessageSquare size={28} className="text-white/10" />
                  <p className="text-xs text-white/25 leading-relaxed">
                    {user?.role === "OWNER" ? t("messages_no_msgs_tenant") : t("messages_no_msgs_landlord")}
                  </p>
                </div>
              ) : (
                grouped.map(group => (
                  <div key={group.date} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-white/[0.05]" />
                      <span className="text-[9px] font-bold uppercase tracking-[2px] text-white/20 px-2">{group.date}</span>
                      <div className="flex-1 h-px bg-white/[0.05]" />
                    </div>

                    {group.items.map(msg => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          data-testid={`message-${msg.id}`}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div className="max-w-[80%] sm:max-w-[72%] space-y-1">
                            <div
                              className={`px-3 sm:px-4 py-3 text-sm leading-relaxed ${
                                isMine
                                  ? "bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-white/80"
                                  : "bg-white/[0.05] border border-white/[0.08] text-white/65"
                              }`}
                            >
                              {msg.body}
                            </div>
                            <p className={`text-[9px] text-white/20 font-medium tracking-wide ${isMine ? "text-right" : "text-left"}`}>
                              {formatTime(msg.createdAt)}
                              {!isMine && !msg.read && (
                                <span className="ml-2 inline-block w-1.5 h-1.5 rounded-full bg-[#8B5CF6] align-middle" />
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Compose bar */}
            <div className="border-t border-white/[0.06] px-4 sm:px-5 py-3 sm:py-4 bg-zinc-950/60">
              {sendMutation.isError && (
                <div className="flex items-center gap-2 text-red-400/70 text-xs mb-3">
                  <AlertCircle size={12} />
                  <span>{t("messages_failed_send")}</span>
                </div>
              )}
              <div className="flex items-end gap-2 sm:gap-3">
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={user?.role === "OWNER" ? t("messages_placeholder_tenant") : t("messages_placeholder_landlord")}
                  rows={1}
                  maxLength={2000}
                  data-testid="input-message"
                  className="flex-1 resize-none bg-white/[0.04] border border-white/[0.08] focus:border-[#8B5CF6]/30 focus:outline-none px-3 sm:px-4 py-3 text-sm text-white/75 placeholder:text-white/20 transition-colors duration-200 leading-relaxed"
                  style={{ minHeight: "44px", maxHeight: "120px" }}
                  onInput={(e) => {
                    const el = e.currentTarget;
                    el.style.height = "auto";
                    el.style.height = Math.min(el.scrollHeight, 120) + "px";
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!draft.trim() || sendMutation.isPending}
                  data-testid="button-send-message"
                  className="flex-shrink-0 w-11 h-11 flex items-center justify-center border border-white/10 text-white/30 hover:text-[#8B5CF6]/80 hover:border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/[0.05] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {sendMutation.isPending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Send size={16} />}
                </button>
              </div>
              <p className="text-[9px] text-white/15 mt-2 text-right font-medium tracking-wide hidden sm:block">{t("messages_enter_hint")}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
