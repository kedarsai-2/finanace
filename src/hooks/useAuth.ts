import { useCallback, useSyncExternalStore } from "react";
import { clearJwt, getJwt, setJwt, subscribeAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/flags";

export function useAuth() {
  const token = useSyncExternalStore(subscribeAuth, getJwt, () => null);
  const isAuthed = !!token;

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE_URL}/api/authenticate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, rememberMe: true }),
    });
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

  return { token, isAuthed, login, logout };
}
