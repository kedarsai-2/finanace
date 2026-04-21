const TOKEN_KEY = "bm.jwt";
const AUTH_EVENT = "bm.auth.changed";
const API_ACTIVE_BUSINESS_KEY = "bm.activeBusinessId.api";

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

