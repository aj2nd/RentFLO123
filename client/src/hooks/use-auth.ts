import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import type { User } from "@shared/models/auth";
import {
  API_BASE,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
} from "@/lib/auth-token";

async function fetchUser(): Promise<User | null> {
  try {
    const headers: Record<string, string> = {};
    if (Capacitor.isNativePlatform()) {
      const token = await getAuthToken();
      if (!token) return null;
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}/api/auth/user`, {
      credentials: "include",
      headers,
    });
    if (response.status === 401) return null;
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    // Fires when rentflo://auth/callback?token=<jwt> returns to the app after OAuth.
    const urlSub = App.addListener("appUrlOpen", async (event) => {
      try {
        const url = new URL(event.url);
        if (url.protocol === "rentflo:" && url.pathname.includes("/callback")) {
          const token = url.searchParams.get("token");
          if (token) {
            await setAuthToken(token);
          }
        }
      } catch {
        // ignore malformed URLs
      }
      await Browser.close().catch(() => {});
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    });

    // Fires when user closes the Chrome Custom Tab manually
    const browserSub = Browser.addListener("browserFinished", async () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }, 500);
    });

    return () => {
      urlSub.then((h) => h.remove());
      browserSub.then((h) => h.remove());
    };
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const loginUrl = Capacitor.isNativePlatform()
        ? `${API_BASE}/api/login?platform=android`
        : `${API_BASE}/api/login`;
      await Browser.open({
        url: loginUrl,
        windowName: "_blank",
        presentationStyle: "popover",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const headers: Record<string, string> = {};
      if (Capacitor.isNativePlatform()) {
        const token = await getAuthToken();
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      await fetch(`${API_BASE}/api/logout`, {
        method: "POST",
        credentials: "include",
        headers,
      }).catch(() => {});
      if (Capacitor.isNativePlatform()) {
        await clearAuthToken();
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    login: () => loginMutation.mutate(),
    logout: () => logoutMutation.mutate(),
    isLoggingOut: logoutMutation.isPending,
  };
}
