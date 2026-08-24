/** Design: dark, Instagram-DM-style two-thread inbox; violet signals selected threads and actionable linking states. */
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Building2, Headphones, Link2, Loader2, MessageCircle, Send, ShieldCheck } from "lucide-react";
import type { Message, Property } from "@shared/schema";

type InboxThread = "owner" | "support";

function formatTime(timestamp: Date | string | null) {
  return timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
}

function formatDate(timestamp: Date | string | null) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export default function Messages() {
  const { user } = useAuth();
  const [activeThread, setActiveThread] = useState<InboxThread>("owner");
  const [showChat, setShowChat] = useState(false);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: properties = [], isLoading: propertiesLoading } = useQuery<Property[]>({ queryKey: ["/api/properties/mine"] });
  const linkedProperty = properties[0] ?? null;
  const ownerName = user?.role === "OWNER" ? "Tenant" : "Owner";

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages", linkedProperty?.id],
    enabled: activeThread === "owner" && Boolean(linkedProperty),
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (activeThread === "owner" && linkedProperty) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread, linkedProperty, messages]);

  const sendMutation = useMutation({
    mutationFn: (body: string) => apiRequest("POST", `/api/messages/${linkedProperty?.id}`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", linkedProperty?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/badge-counts"] });
      setDraft("");
    },
  });

  const chooseThread = (thread: InboxThread) => {
    setActiveThread(thread);
    setShowChat(true);
  };

  const sendMessage = () => {
    const body = draft.trim();
    if (body && linkedProperty && !sendMutation.isPending) sendMutation.mutate(body);
  };

  const groupedMessages = messages.reduce<{ date: string; items: Message[] }[]>((groups, message) => {
    const date = formatDate(message.createdAt);
    const currentGroup = groups.at(-1);
    if (currentGroup?.date === date) currentGroup.items.push(message);
    else groups.push({ date, items: [message] });
    return groups;
  }, []);

  const activeLabel = activeThread === "support" ? "RentFLO Customer Support" : ownerName;
  const activeSubtitle = activeThread === "support" ? "Official RentFLO help" : linkedProperty ? linkedProperty.address : "Property connection required";

  return (
    <main className="flex overflow-hidden bg-black text-white" style={{ height: "calc(100dvh - var(--topbar-h) - 64px - env(safe-area-inset-bottom, 0px))", minHeight: 360 }}>
      <aside className={`flex flex-shrink-0 flex-col border-r border-white/[0.07] bg-[#06080d] ${showChat ? "hidden md:flex md:w-80" : "w-full md:w-80"}`}>
        <header className="border-b border-white/[0.07] px-5 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-violet-300">Messages</p>
          <h1 className="mt-1 text-xl font-semibold text-white">Inbox</h1>
        </header>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {propertiesLoading ? (
            <div className="flex justify-center py-12"><Loader2 size={18} className="animate-spin text-white/25" /></div>
          ) : (
            <>
              <button data-testid="thread-owner" onClick={() => chooseThread("owner")} className={`mb-1 flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left transition-colors ${activeThread === "owner" ? "bg-violet-500/15 ring-1 ring-violet-400/25" : "hover:bg-white/[0.04]"}`}>
                <ThreadAvatar icon={<Building2 size={18} />} accent="violet" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2"><span className="truncate text-sm font-semibold text-white">{ownerName}</span>{linkedProperty && <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />}</span>
                  <span className={`mt-1 block truncate text-xs ${linkedProperty ? "text-white/45" : "text-violet-200"}`}>{linkedProperty ? linkedProperty.address : "Link Property to Message Owner"}</span>
                </span>
                <ChevronMark />
              </button>

              <button data-testid="thread-support" onClick={() => chooseThread("support")} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left transition-colors ${activeThread === "support" ? "bg-violet-500/15 ring-1 ring-violet-400/25" : "hover:bg-white/[0.04]"}`}>
                <ThreadAvatar icon={<Headphones size={18} />} accent="gold" />
                <span className="min-w-0 flex-1">
                  <span className="text-sm font-semibold text-white">RentFLO Customer Support</span>
                  <span className="mt-1 block truncate text-xs text-white/45">Help with your RentFLO account</span>
                </span>
                <ChevronMark />
              </button>
            </>
          )}
        </div>
      </aside>

      <section className={`min-w-0 flex-1 flex-col ${showChat ? "flex" : "hidden md:flex"}`}>
        <header className="flex items-center gap-3 border-b border-white/[0.07] bg-[#06080d]/85 px-4 py-4 backdrop-blur-xl sm:px-6">
          <button type="button" onClick={() => setShowChat(false)} className="flex h-8 w-8 items-center justify-center text-white/45 md:hidden" aria-label="Back to inbox" data-testid="button-back-to-inbox"><ArrowLeft size={18} /></button>
          <ThreadAvatar icon={activeThread === "support" ? <Headphones size={17} /> : <Building2 size={17} />} accent={activeThread === "support" ? "gold" : "violet"} />
          <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-white">{activeLabel}</h2><p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.13em] text-white/35">{activeSubtitle}</p></div>
        </header>

        {activeThread === "support" ? (
          <SupportThread />
        ) : !linkedProperty ? (
          <OwnerLinkState ownerName={ownerName} />
        ) : (
          <OwnerThread
            messages={messages}
            loading={messagesLoading}
            groupedMessages={groupedMessages}
            currentUserId={user?.id}
            draft={draft}
            onDraftChange={setDraft}
            onSend={sendMessage}
            sending={sendMutation.isPending}
            bottomRef={bottomRef}
          />
        )}
      </section>
    </main>
  );
}

function ThreadAvatar({ icon, accent }: { icon: React.ReactNode; accent: "violet" | "gold" }) {
  const style = accent === "violet" ? "border-violet-400/35 bg-violet-500/10 text-violet-200" : "border-amber-300/35 bg-amber-300/10 text-amber-200";
  return <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border ${style}`}>{icon}</span>;
}

function ChevronMark() { return <span className="text-lg text-white/20">›</span>; }

function OwnerLinkState({ ownerName }: { ownerName: string }) {
  const setupLabel = ownerName === "Owner" ? "Link Property to Message Owner" : "Add Property to Message Tenant";
  return <div className="flex flex-1 flex-col items-center justify-center px-8 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full border border-violet-400/25 bg-violet-500/10 text-violet-200"><Link2 size={27} /></span><h3 className="mt-5 text-lg font-semibold text-white">Link a property first</h3><p className="mt-2 max-w-sm text-sm leading-relaxed text-white/45">Connect your property before opening a private conversation with your {ownerName.toLowerCase()}.</p><Link href="/setup" data-testid="button-link-property" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white"><Link2 size={16} />{setupLabel}</Link></div>;
}

function SupportThread() {
  return <div className="flex flex-1 flex-col items-center justify-center px-8 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/25 bg-amber-300/10 text-amber-100"><ShieldCheck size={27} /></span><h3 className="mt-5 text-lg font-semibold text-white">RentFLO Customer Support</h3><p className="mt-2 max-w-sm text-sm leading-relaxed text-white/45">Open the official support workspace for account, payment, property, and verification help.</p><Link href="/support" data-testid="button-open-support" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white"><MessageCircle size={16} />Open Customer Support</Link></div>;
}

function OwnerThread({ messages, loading, groupedMessages, currentUserId, draft, onDraftChange, onSend, sending, bottomRef }: { messages: Message[]; loading: boolean; groupedMessages: { date: string; items: Message[] }[]; currentUserId?: string; draft: string; onDraftChange: (value: string) => void; onSend: () => void; sending: boolean; bottomRef: React.RefObject<HTMLDivElement | null> }) {
  return <><div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">{loading ? <div className="flex justify-center py-16"><Loader2 size={18} className="animate-spin text-white/25" /></div> : messages.length === 0 ? <div className="flex h-full flex-col items-center justify-center text-center"><MessageCircle size={28} className="text-white/15" /><p className="mt-3 text-sm text-white/40">Start a private conversation with your owner.</p></div> : groupedMessages.map(group => <div key={group.date} className="mb-5 space-y-3"><div className="flex items-center gap-3"><span className="h-px flex-1 bg-white/[0.06]" /><span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/25">{group.date}</span><span className="h-px flex-1 bg-white/[0.06]" /></div>{group.items.map(message => { const mine = message.senderId === currentUserId; return <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}><div className="max-w-[78%]"><p className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${mine ? "rounded-br-md bg-violet-500 text-white" : "rounded-bl-md border border-white/[0.08] bg-white/[0.05] text-white/75"}`}>{message.body}</p><p className={`mt-1 text-[9px] text-white/25 ${mine ? "text-right" : "text-left"}`}>{formatTime(message.createdAt)}</p></div></div>; })}</div>)}<div ref={bottomRef} /></div><div className="border-t border-white/[0.07] bg-[#06080d]/85 px-4 py-3 sm:px-5"><div className="flex items-end gap-2"><textarea value={draft} onChange={event => onDraftChange(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSend(); } }} placeholder="Message Owner…" rows={1} maxLength={2000} data-testid="input-message" className="min-h-11 flex-1 resize-none rounded-2xl border border-white/[0.09] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-violet-400/45" /><button type="button" onClick={onSend} disabled={!draft.trim() || sending} data-testid="button-send-message" className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500 text-white transition-opacity disabled:opacity-35">{sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}</button></div></div></>;
}
