import { Capacitor, CapacitorHttp } from "@capacitor/core";
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

/** Parse JHipster / Spring `problem+json` `fieldErrors` into a short user-facing message. */
export function formatJhipsterFieldErrors(bodyText: string | undefined): string | null {
  if (!bodyText?.trim()) return null;
  try {
    const j = JSON.parse(bodyText) as {
      fieldErrors?: Array<{ field?: string; message?: string }>;
      detail?: string;
    };
    if (Array.isArray(j.fieldErrors) && j.fieldErrors.length > 0) {
      return j.fieldErrors
        .map((e) => {
          const f = e.field ?? "?";
          const m = e.message ?? "";
          return m ? `${f}: ${m}` : f;
        })
        .join(" · ");
    }
    if (typeof j.detail === "string" && j.detail.trim()) return j.detail.trim();
    return null;
  } catch {
    return null;
  }
}

function normalizeNativeBody(
  body: BodyInit | null | undefined,
  contentType: string | undefined,
): unknown {
  if (!body) return undefined;
  if (typeof body === "string") {
    if (contentType?.includes("application/json")) {
      try {
        return JSON.parse(body) as unknown;
      } catch {
        return body;
      }
    }
    return body;
  }
  return body as unknown;
}

function asText(data: unknown): string {
  if (typeof data === "string") return data;
  if (data == null) return "";
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getJwt();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // Use native networking on Capacitor to avoid Android WebView CORS/network quirks.
  if (Capacitor.isNativePlatform()) {
    const method = (init.method ?? "GET").toUpperCase();
    const contentType = headers.get("Content-Type") ?? undefined;

    let nativeResponse;
    try {
      nativeResponse = await CapacitorHttp.request({
        url: `${API_BASE_URL}${path}`,
        method,
        headers: Object.fromEntries(headers.entries()),
        data: normalizeNativeBody(init.body, contentType),
        connectTimeout: 30000,
        readTimeout: 30000,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Network request failed";
      throw new ApiError(msg, 0, msg);
    }

    if (nativeResponse.status === 401) {
      clearJwt();
    }

    if (nativeResponse.status < 200 || nativeResponse.status >= 300) {
      const text = asText(nativeResponse.data);
      throw new ApiError(text || `HTTP ${nativeResponse.status}`, nativeResponse.status, text);
    }

    if (
      nativeResponse.status === 204 ||
      nativeResponse.data == null ||
      nativeResponse.data === ""
    ) {
      return undefined as T;
    }

    if (typeof nativeResponse.data === "string") {
      return JSON.parse(nativeResponse.data) as T;
    }
    return nativeResponse.data as T;
  }

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

function withPagination(path: string, page: number, size: number): string {
  const url = new URL(path, "http://local");
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));
  return `${url.pathname}${url.search}`;
}

function pageSignature(rows: unknown[]): string {
  return rows
    .slice(0, 5)
    .map((row) => {
      if (row && typeof row === "object" && "id" in row) {
        return String((row as { id?: unknown }).id ?? "");
      }
      return JSON.stringify(row);
    })
    .join("|");
}

export async function apiFetchAllPages<T>(
  path: string,
  {
    pageSize = 500,
    maxPages = 1000,
    concurrency = 4,
  }: { pageSize?: number; maxPages?: number; concurrency?: number } = {},
): Promise<T[]> {
  const first = await apiFetch<T[]>(withPagination(path, 0, pageSize));
  if (!Array.isArray(first) || first.length === 0) return [];
  const all: T[] = [...first];
  if (first.length < pageSize) return all;

  let previousSignature = pageSignature(first);
  let page = 1;

  while (page < maxPages) {
    const batchSize = Math.min(concurrency, maxPages - page);
    const pages = Array.from({ length: batchSize }, (_, i) => page + i);
    const results = await Promise.all(
      pages.map((p) => apiFetch<T[]>(withPagination(path, p, pageSize))),
    );

    let reachedEnd = false;
    for (let i = 0; i < results.length; i += 1) {
      const rows = results[i];
      if (!Array.isArray(rows) || rows.length === 0) {
        reachedEnd = true;
        break;
      }

      const signature = pageSignature(rows);
      if (pages[i]! > 0 && signature && signature === previousSignature) {
        reachedEnd = true;
        break;
      }
      previousSignature = signature;

      all.push(...rows);
      if (rows.length < pageSize) {
        reachedEnd = true;
        break;
      }
    }

    if (reachedEnd) break;
    page += batchSize;
  }

  return all;
}
