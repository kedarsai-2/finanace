import { useCallback, useSyncExternalStore } from "react";
import { clearJwt, getAuthoritiesFromToken, getJwt, setJwt, subscribeAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/flags";

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
  const authorities = getAuthoritiesFromToken(token);
  const isAdmin = authorities.includes("ROLE_ADMIN");

  const login = useCallback(async (username: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/api/authenticate`, {
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
      let res: Response;
      try {
        res = await fetch(`${API_BASE_URL}/api/register`, {
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
