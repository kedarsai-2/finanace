import type {
  PurchaseCategory,
  PurchasePaymentMode,
  ReturnPaymentMode,
} from "@/types/purchase";

export type CreditNotePaymentMode = "cash" | "bank";

export interface DocumentMeta {
  cnPaymentMode?: CreditNotePaymentMode;
  purchaseCategory?: PurchaseCategory;
  purchasePaymentMode?: PurchasePaymentMode;
  returnPaymentMode?: ReturnPaymentMode;
}

const META_PREFIX = "##META##";

export function extractMetaFromNotes(notes?: string): {
  cleanNotes?: string;
  meta: DocumentMeta;
} {
  const raw = (notes ?? "").trim();
  if (!raw.startsWith(META_PREFIX)) {
    return { cleanNotes: notes, meta: {} };
  }
  const [first, ...rest] = raw.split("\n");
  try {
    const meta = JSON.parse(first.slice(META_PREFIX.length)) as DocumentMeta;
    const clean = rest.join("\n").trim();
    return { cleanNotes: clean || undefined, meta };
  } catch {
    return { cleanNotes: notes, meta: {} };
  }
}

export function composeNotesWithMeta(
  cleanNotes: string | undefined,
  meta: DocumentMeta,
): string | undefined {
  const payload: DocumentMeta = {};
  if (meta.cnPaymentMode) payload.cnPaymentMode = meta.cnPaymentMode;
  if (meta.purchaseCategory) payload.purchaseCategory = meta.purchaseCategory;
  if (meta.purchasePaymentMode) payload.purchasePaymentMode = meta.purchasePaymentMode;
  if (meta.returnPaymentMode) payload.returnPaymentMode = meta.returnPaymentMode;
  const note = (cleanNotes ?? "").trim();
  if (
    !payload.cnPaymentMode &&
    !payload.purchaseCategory &&
    !payload.purchasePaymentMode &&
    !payload.returnPaymentMode
  ) {
    return note || undefined;
  }
  const metaLine = `${META_PREFIX}${JSON.stringify(payload)}`;
  if (!note) return metaLine;
  return `${metaLine}\n${note}`;
}
