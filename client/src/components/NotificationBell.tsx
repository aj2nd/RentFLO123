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
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { status, subscribe, unsubscribe } = usePushNotifications();

  const updatePos = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({
      left: Math.min(r.right + 8, window.innerWidth - 340),
      bottom: window.innerHeight - r.top - r.height / 2 - 20,
    });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", updatePos, true);
    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", updatePos, true);
    };
  }, [open]);

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
      const target = e.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        panelRef.current && !panelRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-none transition-all"
        style={{ color: "var(--nav-text-dim)" }}
        data-testid="button-notification-bell"
        title="Notifications"
      >
        {unread > 0 ? (
          <BellRing size={18} style={{ color: "var(--tiffany)" }} />
        ) : (
          <Bell size={18} />
        )}
        {unread > 0 && (
          <span
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{ background: "var(--tiffany)" }}
          />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="fixed w-80 shadow-2xl z-[100]"
          style={{
            left: pos?.left ?? 80,
            bottom: pos?.bottom ?? 80,
            background: "var(--surface-card)",
            border: "1px solid var(--nav-border)",
            minWidth: 300,
            maxWidth: "calc(100vw - 32px)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: "var(--nav-border)" }}
          >
            <span
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--tiffany)", opacity: 0.8 }}
            >
              Notifications
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => status === "subscribed" ? unsubscribe() : subscribe()}
                disabled={status === "unsupported" || status === "denied" || status === "loading"}
                className="flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-1 border transition-all"
                style={{
                  borderColor: status === "subscribed" ? "var(--tiffany)" : "var(--nav-border)",
                  color: status === "subscribed" ? "var(--tiffany)" : "var(--nav-text-dim)",
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
              <button
                onClick={() => setOpen(false)}
                className="transition-colors"
                style={{ color: "var(--nav-text-dim)" }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div
                className="py-8 text-center text-xs"
                style={{ color: "var(--nav-text-dim)", opacity: 0.5 }}
              >
                No notifications yet
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  className="px-4 py-3 border-b transition-colors"
                  style={{
                    borderColor: "var(--nav-border)",
                    background: !n.read ? "rgba(111,255,233,0.04)" : "transparent",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 border"
                          style={{ borderColor: "var(--tiffany)", color: "var(--tiffany)", opacity: 0.8 }}
                        >
                          {TYPE_LABELS[n.type] ?? n.type}
                        </span>
                        {!n.read && (
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: "var(--tiffany)" }}
                          />
                        )}
                      </div>
                      <p className="text-xs font-medium leading-snug" style={{ color: "var(--nav-text)" }}>
                        {n.title}
                      </p>
                      <p className="text-[11px] mt-0.5 leading-snug" style={{ color: "var(--nav-text-dim)" }}>
                        {n.body}
                      </p>
                    </div>
                    <span className="text-[10px] flex-shrink-0 mt-0.5" style={{ color: "var(--nav-text-dim)", opacity: 0.6 }}>
                      {formatRelative(n.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifs.length > 0 && (
            <div className="px-4 py-2 border-t" style={{ borderColor: "var(--nav-border)" }}>
              <button
                onClick={() => markRead.mutate()}
                className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider transition-colors"
                style={{ color: "var(--nav-text-dim)" }}
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
