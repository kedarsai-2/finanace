import { useCallback, useSyncExternalStore } from "react";
import { clearJwt, getJwt, setJwt, subscribeAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/flags";
import { httpRequest } from "@/lib/http";

function parseJwtClaims(token: string | null): Record<string, unknown> | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeAuthNetworkError(error: unknown): Error {
  if (!(error instanceof TypeError)) {
    return error instanceof Error ? error : new Error("Request failed");
  }
  const networkHint =
    "Network error: cannot reach backend API. For Android, set VITE_API_BASE_URL to your public backend URL (or use emulator host 10.0.2.2 for local backend).";
  return new Error(networkHint);
}

export function useAuth() {
  const token = useSyncExternalStore(subscribeAuth, getJwt, () => null);
  const isAuthed = !!token;
  const claims = parseJwtClaims(token);
  const rawAuthorities = typeof claims?.auth === "string" ? claims.auth : "";
  const authorities = rawAuthorities
    .split(" ")
    .map((x) => x.trim())
    .filter(Boolean);
  const isAdmin = authorities.includes("ROLE_ADMIN");

  const login = useCallback(async (username: string, password: string) => {
    let res: Awaited<ReturnType<typeof httpRequest>>;
    try {
      res = await httpRequest(`${API_BASE_URL}/api/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, rememberMe: true }),
      });
    } catch (error) {
      throw normalizeAuthNetworkError(error);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Login failed (${res.status})`);
    }
    const json = (await res.json()) as { id_token?: string };
    if (!json.id_token) throw new Error("Login response missing id_token");
    setJwt(json.id_token);
    return json.id_token;
  }, []);

  const logout = useCallback(() => {
    clearJwt();
  }, []);

  const register = useCallback(
    async (payload: {
      login: string;
      password: string;
      email?: string;
      firstName?: string;
      lastName?: string;
    }) => {
      let res: Awaited<ReturnType<typeof httpRequest>>;
      try {
        res = await httpRequest(`${API_BASE_URL}/api/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        throw normalizeAuthNetworkError(error);
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Register failed (${res.status})`);
      }
    },
    [],
  );

  return { token, isAuthed, isAdmin, authorities, login, logout, register };
}
