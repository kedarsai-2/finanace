import type { Account } from "@/types/account";
import type { PaymentMode } from "@/types/payment";

/** Accounts available in payment pickers: same business + any already selected on this document. */
export function accountsForPaymentPicker(
  accounts: Account[],
  businessId: string | null | undefined,
  selectedAccountIds: Array<string | undefined | null> = [],
): Account[] {
  const selected = new Set(selectedAccountIds.filter((id): id is string => !!id));
  if (!businessId) {
    return accounts.filter((a) => selected.has(a.id));
  }
  return accounts.filter((a) => a.businessId === businessId || selected.has(a.id));
}

export function accountOptionsForMode(accounts: Account[], mode: PaymentMode): Account[] {
  if (mode === "cash") return accounts.filter((a) => a.type === "cash");
  if (mode === "bank" || mode === "cheque") return accounts.filter((a) => a.type === "bank");
  return accounts;
}

/** Excel/bulk-import receipts — tracked on the invoice but not edited as payment rows. */
export function isImportLedgerPayment(p: {
  excludeFromLedger?: boolean;
  proofName?: string | null;
}): boolean {
  if (p.excludeFromLedger) return true;
  const name = (p.proofName ?? "").toLowerCase();
  return name.startsWith("import-") && name.includes("placeholder");
}

export function allocationMatchesDocument(
  alloc: { docId: string; docNumber: string },
  documentId: string,
  documentNumber: string,
): boolean {
  const norm = (s: string) => s.trim().toLowerCase();
  const aDoc = norm(alloc.docId);
  const dDoc = norm(documentId);
  if (aDoc && dDoc && aDoc === dDoc) return true;
  const aNum = parseInt(alloc.docId, 10);
  const dNum = parseInt(documentId, 10);
  if (!Number.isNaN(aNum) && !Number.isNaN(dNum) && aNum === dNum) return true;
  const docNo = norm(documentNumber);
  const allocNo = norm(alloc.docNumber ?? "");
  return docNo.length > 0 && allocNo === docNo;
}
