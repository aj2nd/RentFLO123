import { Bell, BellOff, BellRing, X, CheckCheck } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import type { Notification } from "@shared/schema";

const TYPE_LABELS: Record<string, string> = {
  RENT_ADVANCED: "Rent Advanced",
  RENT_COLLECTED: "Payment Received",
  MAINTENANCE_CREATED: "Maintenance Request",
  MAINTENANCE_RESOLVED: "Issue Resolved",
  RENT_DUE: "Rent Due",
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { status, subscribe, unsubscribe } = usePushNotifications();

  const { data: notifs = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 60_000,
  });

  const unread = notifs.filter(n => !n.read).length;

  const markRead = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/read", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  useEffect(() => {
    if (open && unread > 0) markRead.mutate();
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-none text-[#6FFFE9]/60 hover:text-[#6FFFE9] hover:bg-[#6FFFE9]/8 transition-all"
        data-testid="button-notification-bell"
        title="Notifications"
      >
        {unread > 0 ? <BellRing size={18} className="text-[#6FFFE9]" /> : <Bell size={18} />}
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#6FFFE9]" />
        )}
      </button>

      {open && (
        <div
          className="absolute left-full top-0 ml-2 w-80 bg-[#0a0a0a] border border-[#6FFFE9]/20 shadow-2xl z-50"
          style={{ minWidth: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#6FFFE9]/10">
            <span className="text-xs font-semibold uppercase tracking-widest text-[#6FFFE9]/70">
              Notifications
            </span>
            <div className="flex items-center gap-2">
              {/* Push toggle */}
              <button
                onClick={() => status === "subscribed" ? unsubscribe() : subscribe()}
                disabled={status === "unsupported" || status === "denied" || status === "loading"}
                className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 border transition-all"
                style={{
                  borderColor: status === "subscribed" ? "rgba(111,255,233,0.4)" : "rgba(255,255,255,0.1)",
                  color: status === "subscribed" ? "#6FFFE9" : "#666",
                }}
                title={
                  status === "unsupported" ? "Push not supported in this browser"
                  : status === "denied" ? "Notifications blocked — enable in browser settings"
                  : status === "subscribed" ? "Disable push alerts"
                  : "Enable push alerts"
                }
                data-testid="button-toggle-push"
              >
                {status === "subscribed" ? <BellRing size={10} /> : <BellOff size={10} />}
                {status === "subscribed" ? "On" : status === "unsupported" ? "N/A" : status === "denied" ? "Blocked" : "Off"}
              </button>
              <button onClick={() => setOpen(false)} className="text-[#6FFFE9]/40 hover:text-[#6FFFE9]">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6FFFE9]/30">
                No notifications yet
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-[#6FFFE9]/5 transition-colors ${!n.read ? "bg-[#6FFFE9]/5" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border"
                          style={{ borderColor: "rgba(111,255,233,0.25)", color: "#6FFFE9" }}
                        >
                          {TYPE_LABELS[n.type] ?? n.type}
                        </span>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#6FFFE9] flex-shrink-0" />}
                      </div>
                      <p className="text-xs font-medium text-white leading-snug">{n.title}</p>
                      <p className="text-[11px] text-[#6FFFE9]/50 mt-0.5 leading-snug">{n.body}</p>
                    </div>
                    <span className="text-[10px] text-zinc-600 flex-shrink-0 mt-0.5">
                      {formatRelative(n.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifs.length > 0 && (
            <div className="px-4 py-2 border-t border-[#6FFFE9]/10">
              <button
                onClick={() => markRead.mutate()}
                className="flex items-center gap-1.5 text-[10px] text-[#6FFFE9]/40 hover:text-[#6FFFE9] transition-colors uppercase tracking-wider"
                data-testid="button-mark-all-read"
              >
                <CheckCheck size={11} /> Mark all read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatRelative(date: Date | string | null): string {
  if (!date) return "";
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}
