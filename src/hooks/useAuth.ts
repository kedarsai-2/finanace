import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { useCallback, useSyncExternalStore } from "react";
import { clearJwt, getAuthoritiesFromToken, getJwt, setJwt, subscribeAuth } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/flags";

function normalizeAuthNetworkError(error: unknown): Error {
  const message = error instanceof Error ? error.message : "Request failed";
  if (error instanceof TypeError || /network|timeout|unable to resolve host|failed to connect/i.test(message)) {
    return new Error(
      "Cannot reach backend. The server may be starting up (wait 30s and retry), or check your internet connection.",
    );
  }
  return new Error(message);
}

async function postJson<TReq, TRes>(path: string, payload: TReq): Promise<TRes> {
  const url = `${API_BASE_URL}${path}`;

  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.request({
      url,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: payload,
      connectTimeout: 30000,
      readTimeout: 30000,
    });

    if (res.status < 200 || res.status >= 300) {
      const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data ?? "");
      throw new Error(text || `Request failed (${res.status})`);
    }

    if (typeof res.data === "string") {
      return JSON.parse(res.data) as TRes;
    }
    return res.data as TRes;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed (${res.status})`);
  }

  return (await res.json()) as TRes;
}

export function useAuth() {
  const token = useSyncExternalStore(subscribeAuth, getJwt, () => null);
  const isAuthed = !!token;
  const authorities = getAuthoritiesFromToken(token);
  const isAdmin = authorities.includes("ROLE_ADMIN");

  const login = useCallback(async (username: string, password: string) => {
    let json: { id_token?: string };
    try {
      json = await postJson<{ username: string; password: string; rememberMe: boolean }, { id_token?: string }>(
        "/api/authenticate",
        { username, password, rememberMe: true },
      );
    } catch (error) {
      throw normalizeAuthNetworkError(error);
    }

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
      try {
        await postJson<typeof payload, unknown>("/api/register", payload);
      } catch (error) {
        throw normalizeAuthNetworkError(error);
      }
    },
    [],
  );

  return { token, isAuthed, isAdmin, authorities, login, logout, register };
}
