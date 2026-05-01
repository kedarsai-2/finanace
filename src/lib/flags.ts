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

function resolveApiBaseUrl(): string {
  if (isNativeCapacitor) {
    // Never use localhost from device — it cannot reach host machine.
    const base = configuredApiBase || PRODUCTION_BACKEND;
    if (/^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base)) {
      return "http://10.0.2.2:8080";
    }
    return base;
  }
  return configuredApiBase || "http://localhost:8080";
}

export const API_BASE_URL = resolveApiBaseUrl();
