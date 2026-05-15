import type { Account } from "@/types/account";
import { ACCOUNT_TYPE_LABEL } from "@/types/account";
import type { Payment, PaymentMode } from "@/types/payment";

/** Payments posted only against one document (e.g. credit note / purchase return settlement). */
export function paymentsSolelyAllocatedToDocument(
  payments: Payment[],
  docId: string,
  docNumber = "",
): Payment[] {
  return payments.filter(
    (p) =>
      p.allocations.length > 0 &&
      p.allocations.every((a) => allocationMatchesDocument(a, docId, docNumber)),
  );
}

/** All usable accounts for payment pickers (cross-business). */
export function accountsForPaymentPicker(accounts: Account[]): Account[] {
  return accounts.filter((a) => !!a.id && !a.deleted);
}

export function accountOptionsForMode(accounts: Account[], mode: PaymentMode): Account[] {
  if (mode === "cash") return accounts.filter((a) => a.type === "cash");
  if (mode === "bank" || mode === "cheque") return accounts.filter((a) => a.type === "bank");
  return accounts;
}

/** Dropdown options for a payment, always including the saved account when present. */
export function accountOptionsForPayment(
  accounts: Account[],
  mode: PaymentMode,
  savedAccountId?: string,
): Account[] {
  const opts = accountOptionsForMode(accounts, mode);
  if (!savedAccountId) return opts;
  if (opts.some((a) => a.id === savedAccountId)) return opts;
  const saved = accounts.find((a) => a.id === savedAccountId);
  return saved ? [saved, ...opts] : opts;
}

/** Match saved payment to an account row (id first; name only when unambiguous). */
export function resolvePaymentAccountId(
  payment: Pick<Payment, "accountId" | "account" | "mode" | "businessId">,
  accounts: Account[],
): string | undefined {
  if (payment.accountId) {
    const byId = accounts.find((a) => a.id === payment.accountId);
    if (byId) return byId.id;
  }
  const name = (payment.account ?? "").trim().toLowerCase();
  if (!name) return undefined;

  const scoped =
    payment.businessId != null && payment.businessId !== ""
      ? accounts.filter((a) => a.businessId === payment.businessId)
      : accounts;
  const pool = scoped.length > 0 ? scoped : accounts;
  const forMode = accountOptionsForMode(pool, payment.mode);
  const matches = forMode.filter((a) => a.name.trim().toLowerCase() === name);
  if (matches.length === 1) return matches[0].id;
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
