import type { AuditAction, AuditChange, AuditEntry, AuditModule } from "@/types/audit";

const STORAGE_KEY = "bm.auditLogs";
const DEFAULT_USER = "You";
/** Cap stored entries to keep localStorage bounded. */
const MAX_ENTRIES = 1000;
/** Internal fields ignored when computing diffs. */
const IGNORED_FIELDS = new Set([
  "id",
  "businessId",
  "createdAt",
  "updatedAt",
  "finalizedAt",
  "deleted",
]);

function readAll(): AuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: AuditEntry[]) {
  if (typeof window === "undefined") return;
  const trimmed = entries.length > MAX_ENTRIES ? entries.slice(-MAX_ENTRIES) : entries;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* ignore quota errors */
  }
  // Notify subscribers (same-tab) — storage event only fires across tabs.
  window.dispatchEvent(new CustomEvent("bm.audit.changed"));
}

export function readAuditLogs(): AuditEntry[] {
  return readAll();
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Shallow diff with deep-equal comparison per field. */
export function diffRecords(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
): AuditChange[] {
  const a = before ?? {};
  const b = after ?? {};
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: AuditChange[] = [];
  for (const k of keys) {
    if (IGNORED_FIELDS.has(k)) continue;
    const av = (a as Record<string, unknown>)[k];
    const bv = (b as Record<string, unknown>)[k];
    if (JSON.stringify(av) === JSON.stringify(bv)) continue;
    out.push({ field: k, before: av, after: bv });
  }
  return out;
}

interface LogArgs {
  module: AuditModule;
  action: AuditAction;
  recordId: string;
  reference: string;
  refLink?: string;
  businessId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  user?: string;
}

export function logAudit(args: LogArgs): void {
  const entries = readAll();
  let changes: AuditChange[] | undefined;
  let snapshot: Record<string, unknown> | undefined;

  if (args.action === "edit") {
    changes = diffRecords(args.before, args.after);
    if (changes.length === 0) return; // nothing actually changed
  } else if (args.action === "create") {
    snapshot = args.after ?? undefined;
  } else if (args.action === "delete" || args.action === "cancel") {
    snapshot = args.before ?? args.after ?? undefined;
  } else if (args.action === "payment") {
    snapshot = args.after ?? undefined;
  }

  const entry: AuditEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    user: args.user ?? DEFAULT_USER,
    businessId: args.businessId,
    module: args.module,
    action: args.action,
    recordId: args.recordId,
    reference: args.reference,
    refLink: args.refLink,
    changes,
    snapshot,
  };
  writeAll([...entries, entry]);
}

/** Strip internal/derived fields before logging a snapshot. */
export function snapshot<T extends object>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (k === "deleted") continue;
    out[k] = v;
  }
  return out;
}

export { isObject };
