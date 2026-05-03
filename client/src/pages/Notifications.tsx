import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, CheckCheck, Loader2, Home, Wrench, CreditCard, AlertCircle, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { Notification } from "@shared/schema";

function notifIcon(type: string) {
  const cls = "shrink-0 mt-0.5";
  switch (type) {
    case "RENT_ADVANCED":     return <CreditCard size={16} className={`${cls} text-[#6FFFE9]`} />;
    case "RENT_COLLECTED":    return <CreditCard size={16} className={`${cls} text-[#6FFFE9]`} />;
    case "MAINTENANCE_CREATED":  return <Wrench size={16} className={`${cls} text-yellow-400`} />;
    case "MAINTENANCE_RESOLVED": return <Wrench size={16} className={`${cls} text-[#6FFFE9]`} />;
    case "RENT_DUE":          return <CalendarClock size={16} className={`${cls} text-orange-400`} />;
    default:                  return <AlertCircle size={16} className={`${cls} text-zinc-400`} />;
  }
}

function timeAgo(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function NotificationsPage() {
  const { user } = useAuth();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/read", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#6FFFE9]/40" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="p-4 sm:p-6 md:p-10 pb-24 max-w-lg">

        <header className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Inbox</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter flex items-center gap-3">
              Notifications
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 bg-[#6FFFE9] text-black text-[10px] font-bold rounded-full" data-testid="badge-unread-count">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markReadMutation.mutate()}
              disabled={markReadMutation.isPending}
              className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white rounded-none h-8 px-3 gap-1.5"
              data-testid="button-mark-all-read"
            >
              <CheckCheck size={13} />
              Mark all read
            </Button>
          )}
        </header>

        {(!notifications || notifications.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell size={32} className="text-zinc-700 mb-3" />
            <p className="text-zinc-500 text-sm">No notifications yet</p>
            <p className="text-zinc-700 text-xs mt-1">We'll notify you about rent, repairs, and more</p>
          </div>
        )}

        <div className="space-y-2">
          {notifications?.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              {notif.url ? (
                <Link href={notif.url}>
                  <NotifCard notif={notif} />
                </Link>
              ) : (
                <NotifCard notif={notif} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NotifCard({ notif }: { notif: Notification }) {
  return (
    <div
      className={`flex items-start gap-3 p-4 border transition-colors ${
        notif.read
          ? "border-white/[0.05] bg-zinc-950/30"
          : "border-[#6FFFE9]/20 bg-[#6FFFE9]/[0.03]"
      }`}
      data-testid={`card-notification-${notif.id}`}
    >
      {notifIcon(notif.type)}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-snug ${notif.read ? "text-zinc-300" : "text-white"}`}>
            {notif.title}
          </p>
          <span className="text-[10px] text-zinc-600 shrink-0 mt-0.5">{timeAgo(notif.createdAt)}</span>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{notif.body}</p>
      </div>
      {!notif.read && (
        <div className="w-1.5 h-1.5 rounded-full bg-[#6FFFE9] shrink-0 mt-1.5" />
      )}
    </div>
  );
}
