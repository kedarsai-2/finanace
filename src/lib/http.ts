import { IS_NATIVE_APP } from "@/lib/flags";

type HttpLikeResponse = {
  status: number;
  ok: boolean;
  text: string;
  json: unknown;
};

function toHeaderObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

export async function httpRequest(url: string, init: RequestInit = {}): Promise<HttpLikeResponse> {
  const headers = new Headers(init.headers);
  const method = (init.method || "GET").toUpperCase();

  if (IS_NATIVE_APP) {
    const { CapacitorHttp } = await import("@capacitor/core");
    let data: unknown = undefined;
    if (typeof init.body === "string") {
      const contentType = headers.get("Content-Type") || headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          data = JSON.parse(init.body);
        } catch {
          data = init.body;
        }
      } else {
        data = init.body;
      }
    }
    const res = await CapacitorHttp.request({
      url,
      method,
      headers: toHeaderObject(headers),
      data,
    });
    const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data ?? "");
    return {
      status: res.status,
      ok: res.status >= 200 && res.status < 300,
      text,
      json:
        typeof res.data === "string"
          ? (() => {
              try {
                return JSON.parse(res.data);
              } catch {
                return null;
              }
            })()
          : res.data,
    };
  }

  const res = await fetch(url, { ...init, headers });
  const text = await res.text().catch(() => "");
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, ok: res.ok, text, json };
}
