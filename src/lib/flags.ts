const envBackendEnabled =
  import.meta.env.VITE_USE_BACKEND === "1" || import.meta.env.VITE_USE_BACKEND === "true";

const cap =
  typeof window !== "undefined"
    ? (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    : undefined;
const isNativeCapacitor = !!cap?.isNativePlatform?.();

// Production backend — always used for native APK builds.
const PRODUCTION_BACKEND = "https://finanace-454d.onrender.com";

// APK should always run against backend auth/data APIs.
export const USE_BACKEND = envBackendEnabled || isNativeCapacitor;

// For native builds, always pin to production backend.
// For web, fall back to VITE_API_BASE_URL or local dev server.
const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.toString()?.trim() || "";

function stripTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, "");
}

/** True when the API host is loopback (device cannot reach your PC). */
function isLoopbackApiHost(base: string): boolean {
  try {
    const withProto = base.includes("://") ? base : `http://${base}`;
    const { hostname } = new URL(withProto);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

function resolveApiBaseUrl(): string {
  if (isNativeCapacitor) {
    const base = stripTrailingSlashes(configuredApiBase || PRODUCTION_BACKEND);
    if (isLoopbackApiHost(base)) {
      // Replacing localhost with 10.0.2.2 only works on the Android emulator; on a real
      // phone it fails with "cannot reach backend". Use production unless you explicitly set
      // VITE_API_BASE_URL (e.g. http://10.0.2.2:8080 for emulator + local JHipster).
      return stripTrailingSlashes(PRODUCTION_BACKEND);
    }
    return base;
  }
  return stripTrailingSlashes(configuredApiBase || "http://localhost:8080");
}

export const API_BASE_URL = resolveApiBaseUrl();
