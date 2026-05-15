import type { Account } from "@/types/account";
import { ACCOUNT_TYPE_LABEL } from "@/types/account";
import { parseSpreadsheetPaymentMode } from "@/lib/spreadsheetImportLedger";
import type { Payment, PaymentDirection, PaymentMode } from "@/types/payment";
import { PAYMENT_MODE_LABEL } from "@/types/payment";

/** True when any allocation line hits one of the documents (id or doc number). */
export function paymentAllocatesToDocumentList(
  payment: Pick<Payment, "allocations">,
  documents: Array<{ id: string; number?: string }>,
): boolean {
  const allocs = payment.allocations ?? [];
  if (!allocs.length || !documents.length) return false;
  return allocs.some((a) =>
    documents.some((d) => allocationMatchesDocument(a, d.id, d.number ?? "")),
  );
}

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

/** Compact label for select triggers (avoids overflowing narrow dialogs). */
export function formatAccountTriggerLabel(
  account: Account,
  businessName?: string,
  showBusiness = false,
): string {
  if (!showBusiness || !businessName) return account.name;
  const shortBiz =
    businessName.length > 28 ? `${businessName.slice(0, 26).trimEnd()}…` : businessName;
  return `${account.name} · ${shortBiz}`;
}

/** Radix Select `textValue` — short label in trigger, long label in dropdown item body. */
export function accountSelectTextValue(
  account: Account,
  businessName?: string,
  showBusiness = false,
): string {
  return formatAccountTriggerLabel(account, businessName, showBusiness);
}

/** Human-readable payment type from invoice/purchase import field. */
export function documentPaymentTypeLabel(raw: unknown): string {
  const trimmed = String(raw ?? "").trim();
  if (trimmed) return trimmed;
  return PAYMENT_MODE_LABEL[parseSpreadsheetPaymentMode(raw)];
}

/** Credit-note settlement supports cash/bank only; cheque sales map to bank. */
export function creditNoteSettlementMode(raw: unknown): "cash" | "bank" {
  return parseSpreadsheetPaymentMode(raw) === "cash" ? "cash" : "bank";
}

/** Prefer account from payments on the source document; else first account for mode. */
export function defaultSettlementAccountId(options: {
  mode: PaymentMode;
  accounts: Account[];
  payments: Payment[];
  docId: string;
  direction: PaymentDirection;
}): string {
  const picker = accountsForPaymentPicker(options.accounts);
  const modeMatches = (p: Payment) =>
    p.mode === options.mode ||
    (options.mode === "bank" && p.mode === "cheque") ||
    (options.mode === "cheque" && p.mode === "bank");

  for (const p of options.payments) {
    if (p.direction !== options.direction) continue;
    if (!(p.allocations ?? []).some((a) => a.docId === options.docId)) continue;
    if (!modeMatches(p)) continue;
    const id = resolvePaymentAccountId(p, picker);
    if (id) return id;
  }
  return accountOptionsForMode(picker, options.mode)[0]?.id ?? "";
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
