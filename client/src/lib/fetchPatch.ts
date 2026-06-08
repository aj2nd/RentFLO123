import { Capacitor } from "@capacitor/core";
import { API_BASE, getAuthToken } from "./auth-token";

// On native Android the WebView origin is `https://localhost` (Capacitor's
// internal scheme), so relative `/api/...` URLs never reach rentflo.in and
// session cookies don't cross the WebView/Chrome boundary. We patch the
// global fetch once at boot to:
//   1. Rewrite relative API URLs to the absolute backend
//   2. Attach `Authorization: Bearer <jwt>` from Capacitor Preferences
// Web builds skip both transforms — relative URLs and cookies work normally.
if (Capacitor.isNativePlatform()) {
  const origFetch = window.fetch.bind(window);

  window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    let url: string;
    if (typeof input === "string") {
      url = input;
    } else if (input instanceof URL) {
      url = input.toString();
    } else {
      url = (input as Request).url;
    }

    const isApiCall = url.startsWith("/api/");
    if (isApiCall && API_BASE) {
      url = `${API_BASE}${url}`;
    }

    const nextInit: RequestInit = { ...(init ?? {}) };
    if (API_BASE && url.startsWith(API_BASE)) {
      const token = await getAuthToken();
      if (token) {
        const headers = new Headers(nextInit.headers);
        if (!headers.has("Authorization")) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        nextInit.headers = headers;
      }
    }

    if (typeof input === "string" || input instanceof URL) {
      return origFetch(url, nextInit);
    }
    return origFetch(new Request(url, input as Request), nextInit);
  }) as typeof window.fetch;
}
