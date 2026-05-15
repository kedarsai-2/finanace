import type { Account } from "@/types/account";
import { ACCOUNT_TYPE_LABEL } from "@/types/account";
import type { Payment, PaymentMode } from "@/types/payment";

/** All usable accounts for payment pickers (cross-business). */
export function accountsForPaymentPicker(accounts: Account[]): Account[] {
  return accounts.filter((a) => !!a.id && !a.deleted);
}

export function accountOptionsForMode(accounts: Account[], mode: PaymentMode): Account[] {
  if (mode === "cash") return accounts.filter((a) => a.type === "cash");
  if (mode === "bank" || mode === "cheque") return accounts.filter((a) => a.type === "bank");
  return accounts;
}

/** Match saved payment to an account row (id, then name + mode). */
export function resolvePaymentAccountId(
  payment: Pick<Payment, "accountId" | "account" | "mode">,
  accounts: Account[],
): string | undefined {
  if (payment.accountId) {
    const byId = accounts.find((a) => a.id === payment.accountId);
    if (byId) return byId.id;
  }
  const name = (payment.account ?? "").trim().toLowerCase();
  if (!name) return undefined;
  const forMode = accountOptionsForMode(accounts, payment.mode);
  const byName = forMode.find((a) => a.name.trim().toLowerCase() === name);
  if (byName) return byName.id;
  return undefined;
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
