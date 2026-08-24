// Token storage + API base resolution for the Capacitor Android client.
// Web builds: native-platform checks return false, so getAuthToken() always
// returns null, API_BASE is "", and existing session-cookie auth keeps
// working untouched.
import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

export const API_BASE = Capacitor.isNativePlatform() ? "https://rentflo.in" : "";

const AUTH_TOKEN_KEY = "auth_token";

/**
 * Removes a token left by any legacy browser build. Web authentication uses
 * the HTTP-only session cookie, so browser JavaScript must never retain an
 * equivalent credential. Native Android storage is intentionally untouched.
 */
export function clearLegacyBrowserAuthStorage(): void {
  if (typeof window === "undefined" || Capacitor.isNativePlatform()) return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function getAuthToken(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  const { value } = await Preferences.get({ key: AUTH_TOKEN_KEY });
  return value;
}

export async function setAuthToken(token: string): Promise<void> {
  await Preferences.set({ key: AUTH_TOKEN_KEY, value: token });
}

export async function clearAuthToken(): Promise<void> {
  await Preferences.remove({ key: AUTH_TOKEN_KEY });
}
