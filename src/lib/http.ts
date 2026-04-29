import { Capacitor, CapacitorHttp, type HttpOptions } from "@capacitor/core";

export type HeaderDict = Record<string, string>;

export interface HttpLikeResponse {
  ok: boolean;
  status: number;
  headers: HeaderDict;
  text: () => Promise<string>;
  json: <T = unknown>() => Promise<T>;
}

function toHeaderObject(headers: HeadersInit | undefined): HeaderDict {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

function toHttpBody(init: RequestInit): unknown {
  if (!init.body) return undefined;
  if (typeof init.body === "string") {
    const headers = toHeaderObject(init.headers);
    const contentType = headers["Content-Type"] ?? headers["content-type"] ?? "";
    if (contentType.includes("application/json")) {
      try {
        return JSON.parse(init.body);
      } catch {
        return init.body;
      }
    }
    return init.body;
  }
  return init.body;
}

function toResponseDataText(data: unknown): string {
  if (typeof data === "string") return data;
  if (data == null) return "";
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

export async function httpRequest(url: string, init: RequestInit = {}): Promise<HttpLikeResponse> {
  if (!isNativePlatform()) {
    const res = await fetch(url, init);
    const text = async () => res.text();
    const json = async <T = unknown>() => (await res.json()) as T;
    return {
      ok: res.ok,
      status: res.status,
      headers: toHeaderObject(res.headers),
      text,
      json,
    };
  }

  const options: HttpOptions = {
    url,
    method: init.method ?? "GET",
    headers: toHeaderObject(init.headers),
    data: toHttpBody(init),
  };
  const nativeRes = await CapacitorHttp.request(options);
  const bodyText = toResponseDataText(nativeRes.data);
  const text = async () => bodyText;
  const json = async <T = unknown>() => {
    if (!bodyText) return undefined as T;
    if (typeof nativeRes.data === "object" && nativeRes.data !== null) {
      return nativeRes.data as T;
    }
    return JSON.parse(bodyText) as T;
  };

  return {
    ok: nativeRes.status >= 200 && nativeRes.status < 300,
    status: nativeRes.status,
    headers: toHeaderObject(nativeRes.headers as HeadersInit),
    text,
    json,
  };
}
