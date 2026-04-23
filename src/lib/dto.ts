export function toStrId(id: unknown): string {
  if (id == null) return "";
  return String(id);
}

export function toNumId(id: string | number | null | undefined): number | null {
  if (id == null) return null;
  if (typeof id === "number") return Number.isFinite(id) ? id : null;
  const n = parseInt(id, 10);
  return Number.isFinite(n) ? n : null;
}

export type BusinessRef = { id: number; name?: string | null };

export function businessRefFromId(id: string | number): BusinessRef | null {
  const n = typeof id === "number" ? id : parseInt(id, 10);
  if (!Number.isFinite(n)) return null;
  return { id: n };
}
