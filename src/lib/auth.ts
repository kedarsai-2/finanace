const TOKEN_KEY = "bm.jwt";
const AUTH_EVENT = "bm.auth.changed";
const API_ACTIVE_BUSINESS_KEY = "bm.activeBusinessId.api";

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

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getJwt(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setJwt(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
  notify();
}

export function clearJwt() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  // Backend-mode UI state shouldn't survive logout.
  localStorage.removeItem(API_ACTIVE_BUSINESS_KEY);
  notify();
}

export function subscribeAuth(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const onAny = () => callback();
  window.addEventListener(AUTH_EVENT, onAny);
  window.addEventListener("storage", onAny);
  return () => {
    window.removeEventListener(AUTH_EVENT, onAny);
    window.removeEventListener("storage", onAny);
  };
}

export function getAuthoritiesFromToken(token: string | null): string[] {
  const claims = parseJwtClaims(token);
  const authClaim = claims?.auth;
  if (typeof authClaim === "string") {
    return authClaim
      .split(" ")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  if (Array.isArray(authClaim)) {
    return authClaim.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  }
  return [];
}

export function getSubjectFromToken(token: string | null): string | null {
  const claims = parseJwtClaims(token);
  const sub = claims?.sub;
  return typeof sub === "string" && sub.trim().length > 0 ? sub : null;
}
