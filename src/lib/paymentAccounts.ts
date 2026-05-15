import type { Account } from "@/types/account";
import { ACCOUNT_TYPE_LABEL } from "@/types/account";
import type { PaymentMode } from "@/types/payment";

/** All usable accounts for payment pickers (cross-business). */
export function accountsForPaymentPicker(accounts: Account[]): Account[] {
  return accounts.filter((a) => !!a.id && !a.deleted);
}

export function accountOptionsForMode(accounts: Account[], mode: PaymentMode): Account[] {
  if (mode === "cash") return accounts.filter((a) => a.type === "cash");
  if (mode === "bank" || mode === "cheque") return accounts.filter((a) => a.type === "bank");
  return accounts;
}

export function formatAccountOptionLabel(
  account: Account,
  businessName?: string,
  showBusiness = false,
): string {
  const parts = [account.name, ACCOUNT_TYPE_LABEL[account.type]];
  if (showBusiness && businessName) parts.push(businessName);
  if (account.accountNumber) {
    const masked = account.accountNumber.slice(-4).padStart(account.accountNumber.length, "•");
    parts.push(masked);
  }
  return parts.join(" • ");
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
