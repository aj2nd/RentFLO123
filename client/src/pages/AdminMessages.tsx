import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Building2, User, ChevronRight, ArrowLeft, ShieldAlert } from "lucide-react";
import type { Message, Property } from "@shared/schema";

interface ConversationSummary {
  property: Property;
  messageCount: number;
  lastMessage: Message | null;
  unreadCount: number;
}

interface ConversationDetail {
  property: Property;
  messages: Message[];
}

function formatTime(date: string | Date | null | undefined) {
  if (!date) return "";
  const d = new Date(date as string);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function AdminMessages() {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [showConversation, setShowConversation] = useState(false);

  const { data: conversations = [], isLoading } = useQuery<ConversationSummary[]>({
    queryKey: ["/api/admin/messages"],
    refetchInterval: 10000,
  });

  const { data: detail, isLoading: detailLoading } = useQuery<ConversationDetail>({
    queryKey: ["/api/admin/messages", selectedPropertyId],
    enabled: !!selectedPropertyId,
    refetchInterval: 5000,
  });

  const handleSelect = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setShowConversation(true);
  };

  return (
    <div className="flex bg-background overflow-hidden" style={{ height: "calc(100dvh - 64px - env(safe-area-inset-bottom, 0px))" }}>

      {/* ── Left: conversation list ─────────────────────────────── */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-white/[0.07] flex flex-col shrink-0
          ${showConversation ? "hidden md:flex" : "flex"}`}
      >
        <div className="px-5 py-4 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-2.5">
            <MessageSquare size={18} className="text-[#6FFFE9]" />
            <h1 className="text-white font-semibold tracking-tight text-sm">All Conversations</h1>
          </div>
          <p className="text-[11px] text-zinc-600 mt-0.5 uppercase tracking-widest">Admin oversight</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-[#6FFFE9]/30 border-t-[#6FFFE9] rounded-full animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 px-6 text-center">
              <MessageSquare size={32} className="text-zinc-700" />
              <p className="text-zinc-500 text-sm">No conversations yet</p>
              <p className="text-zinc-700 text-xs">Messages between owners and tenants will appear here.</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.property.id}
                onClick={() => handleSelect(conv.property.id)}
                data-testid={`conversation-item-${conv.property.id}`}
                className={`w-full px-5 py-4 border-b border-white/[0.04] text-left transition-colors duration-150
                  ${selectedPropertyId === conv.property.id
                    ? "bg-[#6FFFE9]/[0.06] border-l-2 border-l-[#6FFFE9]"
                    : "hover:bg-white/[0.03]"
                  }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building2 size={13} className="text-zinc-500 shrink-0 mt-0.5" />
                    <span className="text-white text-sm font-medium truncate">
                      {conv.property.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {conv.unreadCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 bg-[#6FFFE9] text-black text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                        {conv.unreadCount}
                      </span>
                    )}
                    <ChevronRight size={13} className="text-zinc-600" />
                  </div>
                </div>

                {conv.lastMessage && (
                  <p className="text-zinc-500 text-xs mt-1 truncate pl-[19px]">
                    {conv.lastMessage.body}
                  </p>
                )}

                <div className="flex items-center gap-3 mt-1.5 pl-[19px]">
                  <span className="text-[10px] text-zinc-600">
                    {conv.messageCount} message{conv.messageCount !== 1 ? "s" : ""}
                  </span>
                  {conv.lastMessage?.createdAt && (
                    <span className="text-[10px] text-zinc-600">
                      {formatTime(conv.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right: conversation detail ──────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${showConversation ? "flex" : "hidden md:flex"}`}>
        {!selectedPropertyId ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
            <MessageSquare size={40} className="text-zinc-800" />
            <p className="text-zinc-500 text-sm">Select a conversation to view</p>
          </div>
        ) : detailLoading || !detail ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-[#6FFFE9]/30 border-t-[#6FFFE9] rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/[0.07] flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowConversation(false)}
                className="md:hidden text-zinc-400 hover:text-white transition-colors mr-1"
                data-testid="btn-back-conversations"
              >
                <ArrowLeft size={18} />
              </button>
              <Building2 size={15} className="text-[#6FFFE9] shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-white font-semibold text-sm truncate">
                  {detail.property.address}
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  {detail.messages.length} message{detail.messages.length !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-medium border border-white/[0.08] px-2 py-0.5 shrink-0">
                Read Only
              </span>
            </div>

            {/* Compliance notice */}
            <div className="px-5 py-2.5 bg-amber-500/[0.07] border-b border-amber-500/[0.12] flex items-center gap-2 shrink-0">
              <ShieldAlert size={13} className="text-amber-400/70 shrink-0" />
              <p className="text-[11px] text-amber-400/70">
                Admin view — visible for compliance and dispute resolution only.
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {detail.messages.length === 0 ? (
                <div className="flex items-center justify-center h-24">
                  <p className="text-zinc-600 text-sm">No messages in this conversation yet.</p>
                </div>
              ) : (
                detail.messages.map((msg) => {
                  const isOwner = msg.senderId === detail.property.ownerId;
                  const senderLabel = isOwner ? "Owner" : "Tenant";

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col gap-1 ${isOwner ? "items-end" : "items-start"}`}
                      data-testid={`msg-admin-${msg.id}`}
                    >
                      <div className="flex items-center gap-1.5 px-1">
                        <User size={10} className="text-zinc-600" />
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">
                          {senderLabel}
                        </span>
                        <span className="text-[10px] text-zinc-700">·</span>
                        <span className="text-[10px] text-zinc-600">
                          {formatTime(msg.createdAt)}
                        </span>
                        {msg.read && (
                          <>
                            <span className="text-[10px] text-zinc-700">·</span>
                            <span className="text-[10px] text-zinc-700">Read</span>
                          </>
                        )}
                      </div>
                      <div
                        className={`max-w-[72%] px-4 py-2.5 text-sm leading-relaxed break-words ${
                          isOwner
                            ? "bg-[#6FFFE9]/[0.10] text-[#6FFFE9] border border-[#6FFFE9]/[0.18]"
                            : "bg-white/[0.05] text-zinc-200 border border-white/[0.07]"
                        }`}
                      >
                        {msg.body}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
