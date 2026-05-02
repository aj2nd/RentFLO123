import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export type PushStatus = "unsupported" | "denied" | "subscribed" | "unsubscribed" | "loading";

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>("loading");
  const { toast } = useToast();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      setStatus(existing ? "subscribed" : "unsubscribed");
    });
  }, []);

  const subscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;

      const { publicKey } = await fetch("/api/push/vapid-key").then(r => r.json());
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const { endpoint, keys } = subscription.toJSON() as any;
      await apiRequest("POST", "/api/push/subscribe", {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });

      setStatus("subscribed");
      toast({ title: "Notifications enabled", description: "You'll receive push alerts for rent and maintenance updates." });
    } catch (err: any) {
      console.error("[push] subscribe error:", err);
      if (Notification.permission === "denied") {
        setStatus("denied");
      } else {
        setStatus("unsubscribed");
      }
      toast({ title: "Could not enable notifications", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  const unsubscribe = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return;
    setStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await apiRequest("POST", "/api/push/unsubscribe", { endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
      toast({ title: "Notifications disabled" });
    } catch (err: any) {
      setStatus("subscribed");
      toast({ title: "Error disabling notifications", description: err.message, variant: "destructive" });
    }
  }, [toast]);

  return { status, subscribe, unsubscribe };
}
