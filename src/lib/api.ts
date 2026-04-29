import { API_BASE_URL } from "@/lib/flags";
import { clearJwt, getJwt } from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  bodyText?: string;
  constructor(message: string, status: number, bodyText?: string) {
    super(message);
    this.status = status;
    this.bodyText = bodyText;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getJwt();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (res.status === 401) {
    // Token is missing/expired/wrong; clear it so UI can redirect to login.
    clearJwt();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(text || res.statusText, res.status, text);
  }
  // Some endpoints may return empty body (204).
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
