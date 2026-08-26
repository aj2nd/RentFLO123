import { Bell, BellRing } from "lucide-react";
import { useEffect, useState } from "react";

const ALERTS_STORAGE_KEY = "rentflo:alerts-enabled";
const ALERTS_EVENT = "rentflo:alerts-state-change";

function getInitialAlertState() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(ALERTS_STORAGE_KEY) !== "off";
}

export function NotificationBell({ showLabel = false }: { showLabel?: boolean }) {
  const [alertsEnabled, setAlertsEnabled] = useState(getInitialAlertState);

  useEffect(() => {
    window.localStorage.setItem(ALERTS_STORAGE_KEY, alertsEnabled ? "on" : "off");
  }, [alertsEnabled]);

  useEffect(() => {
    const syncAlertState = (event: Event) => {
      setAlertsEnabled((event as CustomEvent<boolean>).detail);
    };
    window.addEventListener(ALERTS_EVENT, syncAlertState);
    return () => window.removeEventListener(ALERTS_EVENT, syncAlertState);
  }, []);

  const toggleAlerts = () => {
    const nextState = !alertsEnabled;
    setAlertsEnabled(nextState);
    window.dispatchEvent(new CustomEvent<boolean>(ALERTS_EVENT, { detail: nextState }));
  };

  const label = alertsEnabled ? "Alerts On" : "Alerts Off";

  return (
    <button
      type="button"
      onClick={toggleAlerts}
      aria-pressed={alertsEnabled}
      aria-label={`Turn alerts ${alertsEnabled ? "off" : "on"}`}
      title={label}
      data-testid="button-alert-toggle"
      className={showLabel ? "flex w-full items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200" : "relative flex h-9 w-9 items-center justify-center rounded-none transition-all duration-200"}
      style={showLabel ? {
        color: alertsEnabled ? "var(--tiffany)" : "var(--nav-text-dim)",
        background: alertsEnabled ? "rgba(111,255,233,0.08)" : "rgba(255,255,255,0.03)",
        border: alertsEnabled ? "1px solid rgba(111,255,233,0.28)" : "1px solid var(--nav-border)",
        boxShadow: alertsEnabled ? "inset 0 1px 0 rgba(111,255,233,0.12)" : "none",
      } : { color: alertsEnabled ? "var(--tiffany)" : "var(--nav-text-dim)" }}
    >
      {alertsEnabled ? <BellRing size={18} /> : <Bell size={18} />}
      {showLabel && (
        <span className="text-[10px] font-semibold uppercase tracking-widest">
          {label}
        </span>
      )}
      {alertsEnabled && !showLabel && (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full" style={{ background: "var(--tiffany)" }} />
      )}
    </button>
  );
}
