import type { Account } from "@/types/account";
import type { PaymentMode } from "@/types/payment";

/** Placeholder proof so backend payment validation passes for Excel-imported rows. */
export const IMPORT_PLACEHOLDER_PROOF: Record<
  PaymentMode,
  { proofDataUrl: string; proofName: string }
> = {
  cash: {
    proofDataUrl: "data:text/plain;base64,Q0FTSF9OT19QUk9PRg==",
    proofName: "import-cash-placeholder.txt",
  },
  bank: {
    proofDataUrl: "data:text/plain;base64,QkFOS19OT19QUk9PRg==",
    proofName: "import-bank-placeholder.txt",
  },
  cheque: {
    proofDataUrl: "data:text/plain;base64,Q0hFUVVFX05PX1BST09G",
    proofName: "import-cheque-placeholder.txt",
  },
};

/** Parse Vyapar-style "Payment Type" text into a payment mode. */
export function parseSpreadsheetPaymentMode(raw: unknown): PaymentMode {
  const rawTrim = String(raw ?? "").trim();
  const v = rawTrim.toLowerCase();
  if (!v) return "cash";
  if (v.includes("cheque") || v.includes("check")) return "cheque";
  if (/^(cash|petty cash|cash payment|paid by cash)$/i.test(rawTrim) || v === "cash in hand") {
    return "cash";
  }
  const bankLike =
    v.includes("bank") ||
    v.includes("upi") ||
    v.includes("imps") ||
    v.includes("neft") ||
    v.includes("rtgs") ||
    v.includes("nach") ||
    v.includes("ecs") ||
    v.includes("online") ||
    v.includes("card") ||
    v.includes("debit") ||
    v.includes("credit card") ||
    v.includes("p2a") ||
    v.includes("p2p") ||
    v.includes("vpa") ||
    v.includes("utr") ||
    v.includes("ifsc") ||
    v.includes("net banking") ||
    v.includes("netbanking") ||
    v.includes("atm") ||
    v.includes("pos") ||
    v.includes("gpay") ||
    v.includes("google pay") ||
    v.includes("phonepe") ||
    v.includes("phone pe") ||
    v.includes("paytm") ||
    v.includes("razorpay");
  if (bankLike) return "bank";
  if (v.includes("cash")) return "cash";
  return "cash";
}

/**
 * Pick a bank account for imported bank/cheque lines from narration (e.g. Vyapar "AXIS BANK (IMPS/...)").
 * When `lastUsedBankAccountStorageKey` is set, falls back to last-used id from localStorage.
 */
export function resolveImportBankAccountId(
  mode: PaymentMode,
  accountsForBusiness: Account[],
  paymentTypeHint?: string,
  lastUsedBankAccountStorageKey?: string | null,
): string | undefined {
  if (mode === "cash") return undefined;
  const banks = accountsForBusiness.filter((a) => a.type === "bank");
  if (banks.length === 0) return undefined;

  const hint = String(paymentTypeHint ?? "")
    .trim()
    .toLowerCase();
  if (hint.length >= 2) {
    let best: { id: string; score: number } | undefined;
    for (const b of banks) {
      const bn = b.name.trim().toLowerCase();
      if (bn.length >= 3 && hint.includes(bn)) {
        const score = bn.length;
        if (!best || score > best.score) best = { id: b.id, score };
      }
    }
    const noise = new Set(["bank", "limited", "ltd", "the", "cooperative"]);
    for (const b of banks) {
      const tokens = b.name
        .toLowerCase()
        .split(/\s+/)
        .map((t) => t.replace(/[^a-z0-9]/gi, ""))
        .filter((t) => t.length >= 3 && !noise.has(t));
      for (const t of tokens) {
        if (hint.includes(t)) {
          const score = t.length;
          if (!best || score > best.score) best = { id: b.id, score };
        }
      }
    }
    if (best) return best.id;
  }

  if (banks.length === 1) return banks[0].id;
  if (lastUsedBankAccountStorageKey && typeof window !== "undefined") {
    const last = window.localStorage.getItem(lastUsedBankAccountStorageKey);
    if (last && banks.some((b) => b.id === last)) return last;
  }
  return banks[0]?.id;
}
