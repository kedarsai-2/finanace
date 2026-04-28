const envBackendEnabled =
  import.meta.env.VITE_USE_BACKEND === "1" || import.meta.env.VITE_USE_BACKEND === "true";

const cap =
  typeof window !== "undefined"
    ? (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    : undefined;
const isNativeCapacitor = !!cap?.isNativePlatform?.();
const NATIVE_DEFAULT_API_BASE_URL = "https://finanace-454d.onrender.com";
export const IS_NATIVE_APP = isNativeCapacitor;

// APK should always run against backend auth/data APIs.
export const USE_BACKEND = envBackendEnabled || isNativeCapacitor;

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.toString()?.trim() || "";

function normalizeApiBaseUrl(raw: string) {
  if (!raw) return "";
  // Android emulator can't reach host machine via localhost.
  if (isNativeCapacitor && /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?$/i.test(raw)) {
    return "http://10.0.2.2:8080";
  }
  return raw;
}

// Prefer explicit env first. If missing, default to deployed backend so APK and web still work.
const effectiveApiBaseUrl = configuredApiBase || NATIVE_DEFAULT_API_BASE_URL;

export const API_BASE_URL = normalizeApiBaseUrl(effectiveApiBaseUrl);
