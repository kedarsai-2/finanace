import {
  Outlet,
  createFileRoute,
  Link,
  useNavigate,
  useRouterState,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { useListPagination } from "@/hooks/useListPagination";
import { ListPaginationBar } from "@/components/ui/ListPaginationBar";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  FileText,
  Ban,
  CircleHelp,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DatePickerField } from "@/components/ui/date-picker-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { verifyActionPassword } from "@/lib/actionPassword";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useAccounts } from "@/hooks/useAccounts";
import { useInvoices } from "@/hooks/useInvoices";
import { formatCurrency } from "@/hooks/useParties";
import { useParties } from "@/hooks/useParties";
import { useItems } from "@/hooks/useItems";
import { usePayments } from "@/hooks/usePayments";
import { PAYMENT_MODE_LABEL } from "@/types/payment";
import {
  computeTotals,
  nextInvoiceNumber,
  paymentStatusOf,
  type Invoice,
  type InvoiceType,
  type InvoiceStatus,
  type PaymentStatus,
} from "@/types/invoice";
import {
  SALES_ITEM_HEADERS,
  SALES_REPORT_HEADERS,
  mapSalesItemRowToInvoiceLineFields,
  mapSalesReportRowToInvoiceFields,
} from "@/lib/expensePurchaseImportMapping";
import {
  IMPORT_PLACEHOLDER_PROOF,
  parseSpreadsheetPaymentMode,
  resolveImportBankAccountId,
} from "@/lib/spreadsheetImportLedger";
import { parseSpreadsheetDate } from "@/lib/spreadsheetDates";
import { sheetToObjectsByHeaderMarker } from "@/lib/spreadsheetSheet";
import { toStrId } from "@/lib/dto";
import { asyncPool, BULK_IO_CONCURRENCY } from "@/lib/asyncPool";
import { USE_BACKEND } from "@/lib/flags";

const STATUS_FILTERS = ["all", "draft", "final", "cancelled"] as const;
const PAY_FILTERS = ["all", "paid", "partial", "unpaid"] as const;
const TYPE_FILTERS = ["all", "standard", "subscription", "advance"] as const;
const DEFAULT_FROM = format(startOfMonth(new Date()), "yyyy-MM-dd");
const DEFAULT_TO = format(endOfMonth(new Date()), "yyyy-MM-dd");

/** Invoice / range `yyyy-MM-dd` in local time — avoids UTC shift from `new Date("yyyy-MM-dd")`. */
function parseInvoiceCalendarDay(raw: string): Date | null {
  const s = String(raw ?? "").trim();
  const head = s.slice(0, 10);
  const m = head.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const dt = new Date(y, mo, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const t = new Date(s);
  return Number.isNaN(t.getTime()) ? null : t;
}

function parseRangeBoundary(ymd: string, endOfDay: boolean): Date | null {
  const m = String(ymd ?? "")
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (Number.isNaN(dt.getTime())) return null;
  if (endOfDay) dt.setHours(23, 59, 59, 999);
  else dt.setHours(0, 0, 0, 0);
  return dt;
}

function normalizeImportKeyPart(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function firstImportKeyPart(...values: unknown[]): string | null {
  for (const value of values) {
    const normalized = normalizeImportKeyPart(value);
    if (normalized) return normalized;
  }
  return null;
}

function salesImportReferenceKey(
  row: Record<string, unknown>,
  mapped: Partial<Invoice>,
): string | null {
  const invoiceNo = firstImportKeyPart(
    mapped.invoiceNo,
    row["Invoice No"],
    row["Invoice No."],
    row["Invoice No./Txn No."],
  );
  if (invoiceNo) return `invoice:${invoiceNo}`;

  const orderNo = firstImportKeyPart(
    mapped.orderNo,
    row["Order No"],
    row["Order No."],
    row["Challan/Order No"],
    row["Challan/Order No."],
  );
  return orderNo ? `order:${orderNo}` : null;
}

function existingSalesImportReferenceKey(inv: Pick<Invoice, "invoiceNo" | "orderNo">): string | null {
  const invoiceNo = firstImportKeyPart(inv.invoiceNo);
  if (invoiceNo) return `invoice:${invoiceNo}`;
  const orderNo = firstImportKeyPart(inv.orderNo);
  return orderNo ? `order:${orderNo}` : null;
}

function salesImportLineRefs(row: Record<string, unknown>, mapped: Partial<Invoice>): string[] {
  return [
    mapped.invoiceNo,
    row["Invoice No"],
    row["Invoice No."],
    row["Invoice No./Txn No."],
    mapped.orderNo,
    row["Order No"],
    row["Order No."],
    row["Challan/Order No"],
    row["Challan/Order No."],
  ]
    .map(normalizeImportKeyPart)
    .filter(Boolean);
}

type StatusFilter = (typeof STATUS_FILTERS)[number];
type PayFilter = (typeof PAY_FILTERS)[number];
type TypeFilter = (typeof TYPE_FILTERS)[number];

const searchSchema = z.object({
  q: z.string().catch("").default(""),
  status: z.enum(STATUS_FILTERS).catch("all").default("all"),
  payment: z.enum(PAY_FILTERS).catch("all").default("all"),
  type: z.enum(TYPE_FILTERS).catch("all").default("all"),
  from: z.string().catch(DEFAULT_FROM).default(DEFAULT_FROM),
  to: z.string().catch(DEFAULT_TO).default(DEFAULT_TO),
});

type SearchValues = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/invoices")({
  validateSearch: (search: Partial<SearchValues> & SearchSchemaInput): SearchValues =>
    searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Sales - QOBOX" },
      {
        name: "description",
        content: "Manage all your sales. Track totals, payments and outstanding balances.",
      },
    ],
  }),
  component: InvoicesRouteLayout,
});

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  final: "Final",
  cancelled: "Cancelled",
};

const STATUS_BADGE: Record<InvoiceStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  final: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

const PAY_BADGE: Record<PaymentStatus, string> = {
  paid: "bg-success/10 text-success",
  partial: "bg-warning/15 text-warning-foreground/80",
  unpaid: "bg-muted text-muted-foreground",
};

function InvoicesRouteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/invoices") return <Outlet />;
  return <InvoicesPage />;
}

function InvoicesPage() {
  const navigate = useNavigate({ from: "/invoices" });
  const { q, status, payment, type, from, to } = Route.useSearch();
  const { activeId, scopedBusinessId, isAll, businesses } = useBusinesses();
  const { invoices, hydrated, remove, cancel, upsert } = useInvoices(scopedBusinessId);
  const { parties, upsert: upsertParty } = useParties(scopedBusinessId);
  const { items, upsert: upsertItem } = useItems(scopedBusinessId);
  const { payments, allPayments, remove: removePayment } = usePayments(scopedBusinessId);
  const { create: createImportPayment, refresh: refreshPaymentsAfterBulk } = usePayments(activeId);
  const { accounts: accountsForImport } = useAccounts(activeId, []);
  const activeBusiness = businesses.find((b) => b.id === activeId);

  const [deleting, setDeleting] = useState<Invoice | null>(null);
  const [cancelling, setCancelling] = useState<Invoice | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const fromBoundary = useMemo(() => (from ? parseRangeBoundary(from, false) : null), [from]);
  const toBoundary = useMemo(() => (to ? parseRangeBoundary(to, true) : null), [to]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return invoices
      .filter((inv) => {
        if (status !== "all" && inv.status !== status) return false;
        if (payment !== "all" && paymentStatusOf(inv) !== payment) return false;
        if (type !== "all" && (inv.invoiceType ?? "standard") !== type) return false;
        const invDay = parseInvoiceCalendarDay(inv.date);
        const invMs = invDay?.getTime();
        if (fromBoundary != null) {
          if (invDay == null || invMs == null || invMs < fromBoundary.getTime()) return false;
        }
        if (toBoundary != null) {
          if (invDay == null || invMs == null || invMs > toBoundary.getTime()) return false;
        }
        if (!term) return true;
        return (
          inv.number.toLowerCase().includes(term) || inv.partyName.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [invoices, q, status, payment, type, fromBoundary, toBoundary]);

  const listPgKey = useMemo(
    () => `${q}|${status}|${payment}|${type}|${from}|${to}`,
    [q, status, payment, type, from, to],
  );
  const listPg = useListPagination(visible, listPgKey);

  const totals = useMemo(() => {
    let total = 0;
    let paid = 0;
    let count = 0;
    for (const inv of visible) {
      if (inv.status === "cancelled") continue;
      total += inv.total;
      paid += inv.paidAmount;
      count += 1;
    }
    return { total, paid, outstanding: total - paid, count };
  }, [visible]);

  const paymentTypeByInvoiceId = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const invoiceIdByNumber = new Map<string, string>();
    for (const inv of invoices) {
      invoiceIdByNumber.set(inv.number.trim().toLowerCase(), inv.id);
    }
    const resolveInvoiceId = (alloc: {
      docId?: string | number | null;
      docNumber?: string | null;
    }): string => {
      const raw = alloc.docId;
      const docIdStr = raw != null && String(raw).trim() !== "" ? toStrId(raw).trim() : "";
      if (docIdStr) {
        const hit = invoices.find((i) => i.id === docIdStr);
        if (hit) return hit.id;
      }
      const docNum = (alloc.docNumber ?? "").trim().toLowerCase();
      return (docNum && invoiceIdByNumber.get(docNum)) || "";
    };
    for (const payment of payments) {
      if (payment.direction !== "in") continue;
      for (const alloc of payment.allocations ?? []) {
        const resolvedInvoiceId = resolveInvoiceId(alloc);
        if (!resolvedInvoiceId) continue;
        const current = map.get(resolvedInvoiceId) ?? new Set<string>();
        current.add(PAYMENT_MODE_LABEL[payment.mode]);
        map.set(resolvedInvoiceId, current);
      }
      if ((payment.allocations ?? []).length === 0 && payment.reference) {
        const refRaw = payment.reference.trim();
        const ref = refRaw.toLowerCase();
        const fallbackInvoiceId =
          invoiceIdByNumber.get(ref) ??
          invoices.find((i) => i.id === toStrId(refRaw) || i.id === refRaw)?.id;
        if (!fallbackInvoiceId) continue;
        const current = map.get(fallbackInvoiceId) ?? new Set<string>();
        current.add(PAYMENT_MODE_LABEL[payment.mode]);
        map.set(fallbackInvoiceId, current);
      }
    }
    return map;
  }, [payments, invoices]);

  const setSearch = (next: Partial<SearchValues>) =>
    navigate({ search: (prev: SearchValues) => ({ ...prev, ...next }) });
  const allVisibleSelected =
    listPg.pageItems.length > 0 && listPg.pageItems.every((i) => selectedIds.has(i.id));
  const selectedCount = visible.filter((i) => selectedIds.has(i.id)).length;
  const toggleSelectAllVisible = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) listPg.pageItems.forEach((i) => next.add(i.id));
      else listPg.pageItems.forEach((i) => next.delete(i.id));
      return next;
    });
  };
  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, idx) => {
        const d = subMonths(new Date(), idx);
        return {
          value: format(d, "yyyy-MM"),
          label: format(d, "MMMM yyyy"),
          from: format(startOfMonth(d), "yyyy-MM-dd"),
          to: format(endOfMonth(d), "yyyy-MM-dd"),
        };
      }),
    [],
  );
  const selectedMonthValue = useMemo(() => {
    const hit = monthOptions.find((m) => m.from === from && m.to === to);
    return hit?.value ?? "custom";
  }, [from, to, monthOptions]);

  const confirmDelete = async () => {
    if (!deleting) return;
    if (!verifyActionPassword()) return;
    const n = deleting.number;
    try {
      const docId = deleting.id;
      const linkedPayments = allPayments.filter(
        (p) => p.allocations.length > 0 && p.allocations.every((a) => a.docId === docId),
      );
      await asyncPool(BULK_IO_CONCURRENCY, linkedPayments, (p) => removePayment(p.id));
      await remove(docId);
      setDeleting(null);
      toast.success(`Deleted ${n}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete invoice";
      toast.error(message);
    }
  };

  const confirmCancel = async () => {
    if (!cancelling) return;
    const n = cancelling.number;
    try {
      await cancel(cancelling.id);
      setCancelling(null);
      toast.success(`Cancelled ${n}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not cancel invoice";
      toast.error(message);
    }
  };
  const confirmBulkDelete = async () => {
    const ids = visible.map((i) => i.id).filter((id) => selectedIds.has(id));
    if (!ids.length) return;
    if (!verifyActionPassword()) return;
    try {
      const deletingIdSet = new Set(ids);
      const linkedPayments = allPayments.filter(
        (p) =>
          p.allocations.length > 0 && p.allocations.every((a) => deletingIdSet.has(a.docId)),
      );
      await asyncPool(BULK_IO_CONCURRENCY, linkedPayments, (p) => removePayment(p.id));
      await asyncPool(BULK_IO_CONCURRENCY, ids, (id) => remove(id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setShowBulkDeleteConfirm(false);
      toast.success(`Deleted ${ids.length} sales`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete selected sales";
      toast.error(message);
    }
  };
  const normalizeMobile = (raw: unknown): string | undefined => {
    const digits = String(raw ?? "").replace(/\D/g, "");
    return /^[6-9]\d{9}$/.test(digits) ? digits : undefined;
  };

  const handleBulkImport = async (file?: File | null) => {
    if (!file) return;
    if (!activeId) {
      toast.error("Select an active business first");
      return;
    }
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const workbook = XLSX.read(buf, { type: "array", cellDates: true });
      const mainSheet = workbook.Sheets["Sale Report"] ?? workbook.Sheets[workbook.SheetNames[0]];
      if (!mainSheet) throw new Error("No sheet found in file");
      const itemSheet = workbook.Sheets["Item Details"];
      const rows = sheetToObjectsByHeaderMarker(mainSheet, "Party Name");
      const itemRows = itemSheet ? sheetToObjectsByHeaderMarker(itemSheet, "Item Name") : [];
      if (rows.length === 0) throw new Error("File has no rows");

      const linesByRef = new Map<string, Invoice["lines"]>();
      const itemNames = new Set(items.map((it) => it.name.trim().toLowerCase()).filter(Boolean));
      let createdItems = 0;
      const newItemsByKey = new Map<
        string,
        {
          id: string;
          businessId: string;
          name: string;
          sku: string | undefined;
          type: "product";
          sellingPrice: number;
          purchasePrice: number;
          taxPercent: number;
          unit: string;
          active: boolean;
        }
      >();
      for (const row of itemRows) {
        const mapped = mapSalesItemRowToInvoiceLineFields(row);
        if (!mapped.name) continue;
        const itemRefs = [
          row["Invoice No./Txn No."],
          row["Challan/Order No"],
          row["Challan/Order No."],
          mapped.challanOrderNo,
        ]
          .map(normalizeImportKeyPart)
          .filter(Boolean);
        const uniqueItemRefs = [...new Set(itemRefs)];
        if (uniqueItemRefs.length === 0) continue;
        const line = {
          id: `sil_${Math.random().toString(36).slice(2, 9)}`,
          name: mapped.name,
          itemCode: mapped.itemCode,
          hsnSac: mapped.hsnSac,
          category: mapped.category,
          challanOrderNo: mapped.challanOrderNo,
          qty: mapped.qty ?? 1,
          unit: mapped.unit ?? "pcs",
          rate: mapped.rate ?? 0,
          discountKind: "percent" as const,
          discountValue: mapped.discountValue ?? 0,
          taxPercent: mapped.taxPercent ?? 0,
          taxAmount: mapped.taxAmount,
          transactionType: mapped.transactionType,
          lineAmount: mapped.lineAmount,
        };
        for (const ref of uniqueItemRefs) {
          const list = linesByRef.get(ref) ?? [];
          list.push(line);
          linesByRef.set(ref, list);
        }

        const itemNameKey = mapped.name.trim().toLowerCase();
        if (!itemNameKey || itemNames.has(itemNameKey) || newItemsByKey.has(itemNameKey)) continue;
        newItemsByKey.set(itemNameKey, {
          id: "",
          businessId: activeId,
          name: mapped.name,
          sku: mapped.itemCode,
          type: "product",
          sellingPrice: Number(mapped.rate ?? 0),
          purchasePrice: Number(mapped.rate ?? 0),
          taxPercent: Number(mapped.taxPercent ?? 0),
          unit: String(mapped.unit ?? "pcs"),
          active: true,
        });
      }
      if (newItemsByKey.size > 0) {
        await asyncPool(BULK_IO_CONCURRENCY, [...newItemsByKey.values()], (payload) =>
          upsertItem(payload),
        );
        for (const k of newItemsByKey.keys()) itemNames.add(k);
        createdItems = newItemsByKey.size;
      }

      let created = 0;
      let skipped = 0;
      let duplicates = 0;
      let createdParties = 0;
      const importedDateKeys: string[] = [];
      const existingForNumber = invoices.map((i) => ({
        number: i.number,
        businessId: i.businessId,
      }));
      const invoiceKeys = new Set(
        invoices
          .map((i) => {
            const dateKey = format(new Date(i.date), "yyyy-MM-dd");
            const partyKey = normalizeImportKeyPart(i.partyName);
            const refKey = existingSalesImportReferenceKey(i);
            return refKey ? `${dateKey}|${partyKey}|${refKey}` : null;
          })
          .filter((key): key is string => key != null),
      );
      const partiesByName = new Map(
        parties
          .filter((p) => p.businessId === activeId)
          .map((p) => [p.name.trim().toLowerCase(), p] as const),
      );

      const pendingParties = new Map<
        string,
        {
          id: string;
          businessId: string;
          name: string;
          mobile: string;
          gstNumber?: string;
          openingBalance: number;
          balance: number;
        }
      >();
      for (const row of rows) {
        const partyName = String(row["Party Name"] ?? "").trim();
        if (!partyName) continue;
        const partyNameKey = partyName.toLowerCase();
        if (partiesByName.has(partyNameKey) || pendingParties.has(partyNameKey)) continue;
        const mappedRow = mapSalesReportRowToInvoiceFields(row);
        pendingParties.set(partyNameKey, {
          id: "",
          businessId: activeId,
          name: partyName,
          mobile: normalizeMobile(mappedRow.partyPhoneNo) ?? "",
          gstNumber: String(mappedRow.gstin ?? "").trim() || undefined,
          openingBalance: 0,
          balance: 0,
        });
      }
      if (pendingParties.size > 0) {
        await asyncPool(BULK_IO_CONCURRENCY, [...pendingParties.entries()], async ([k, payload]) => {
          const saved = await upsertParty(payload);
          partiesByName.set(k, saved);
        });
        createdParties = pendingParties.size;
      }

      const batchInvoiceKeys = new Set(invoiceKeys);
      type SheetRow = (typeof rows)[number];
      const preparedSales: {
        row: SheetRow;
        mapped: ReturnType<typeof mapSalesReportRowToInvoiceFields>;
        party: NonNullable<ReturnType<(typeof partiesByName)["get"]>>;
        importedDate: string;
        lines: Invoice["lines"];
        total: number;
        paidAmount: number;
        computed: ReturnType<typeof computeTotals>;
      }[] = [];

      for (const row of rows) {
        const mapped = mapSalesReportRowToInvoiceFields(row);
        const partyName = String(row["Party Name"] ?? "").trim();
        if (!partyName) {
          skipped += 1;
          continue;
        }
        const partyNameKey = partyName.toLowerCase();
        const party = partiesByName.get(partyNameKey);
        if (!party) {
          skipped += 1;
          continue;
        }

        const importedDate = parseSpreadsheetDate(row["Date"]);
        const dateKey = format(new Date(importedDate), "yyyy-MM-dd");
        importedDateKeys.push(dateKey);
        const totalHint = Number(mapped.total ?? 0);
        const sourceLines =
          salesImportLineRefs(row, mapped)
            .map((ref) => linesByRef.get(ref))
            .find((lines): lines is Invoice["lines"] => Array.isArray(lines) && lines.length > 0) ??
          [];
        const lines =
          sourceLines.length > 0
            ? sourceLines
            : [
                {
                  id: `sil_${Math.random().toString(36).slice(2, 9)}`,
                  name: "Imported line",
                  qty: 1,
                  unit: "pcs",
                  rate: totalHint,
                  discountKind: "percent" as const,
                  discountValue: 0,
                  taxPercent: 0,
                },
              ];
        const computed = computeTotals({
          lines,
          overallDiscountKind: "percent",
          overallDiscountValue: 0,
        });
        const total = totalHint > 0 ? totalHint : computed.total;
        const refKey = salesImportReferenceKey(row, mapped);
        if (refKey) {
          const dedupeKey = `${dateKey}|${partyNameKey}|${refKey}`;
          if (batchInvoiceKeys.has(dedupeKey)) {
            duplicates += 1;
            continue;
          }
          batchInvoiceKeys.add(dedupeKey);
        }
        const paidAmount = Number(mapped.receivedPaidAmount ?? 0);
        preparedSales.push({
          row,
          mapped,
          party,
          importedDate,
          lines,
          total,
          paidAmount,
          computed,
        });
      }

      const allocForInvoiceNumber = existingForNumber.map((x) => ({ ...x }));
      const invoiceNumbers = preparedSales.map(() => {
        const number = nextInvoiceNumber(allocForInvoiceNumber, activeId);
        allocForInvoiceNumber.push({ number, businessId: activeId });
        return number;
      });

      const upsertResults = await asyncPool(
        BULK_IO_CONCURRENCY,
        preparedSales.map((p, i) => ({ ...p, number: invoiceNumbers[i] })),
        async ({ number, row, mapped, party, importedDate, lines, total, paidAmount, computed }, idx) => {
          const finalizedAt = new Date().toISOString();
          const savedInv = await upsert({
            id: `inv_imp_${idx}_${Math.random().toString(36).slice(2, 11)}`,
            businessId: activeId,
            number,
            date: importedDate,
            invoiceType: "standard",
            orderNo: mapped.orderNo,
            invoiceNo: mapped.invoiceNo,
            gstin: mapped.gstin,
            partyPhoneNo: mapped.partyPhoneNo,
            transactionType: mapped.transactionType,
            paymentType: mapped.paymentType,
            receivedPaidAmount: mapped.receivedPaidAmount,
            balanceDue: mapped.balanceDue,
            paymentBreakupJson: mapped.paymentBreakupJson,
            partyId: party.id,
            partyName: party.name,
            partyState: party.state,
            businessState: activeBusiness?.state,
            lines,
            subtotal: computed.subtotal,
            itemDiscountTotal: computed.itemDiscountTotal,
            overallDiscountKind: "percent",
            overallDiscountValue: 0,
            overallDiscountAmount: 0,
            taxableValue: total,
            cgst: 0,
            sgst: 0,
            igst: 0,
            taxTotal: 0,
            total,
            paidAmount,
            status: "final",
            finalizedAt,
            notes: mapped.notes,
            createdAt: new Date().toISOString(),
          });
          return { savedInv, row, mapped, importedDate, paidAmount, total };
        },
      );

      const payJobs = upsertResults
        .map((r) => {
          const payAmt = Math.min(Math.max(0, r.paidAmount), r.total);
          if (payAmt <= 0.001) return null;
          return { ...r, payAmt };
        })
        .filter((x): x is NonNullable<typeof x> => x != null);

      if (payJobs.length > 0) {
        await asyncPool(BULK_IO_CONCURRENCY, payJobs, async (job) => {
          try {
            const mode = parseSpreadsheetPaymentMode(job.mapped.paymentType ?? job.row["Payment Type"]);
            const proof = IMPORT_PLACEHOLDER_PROOF[mode];
            const bizAccounts = accountsForImport.filter((a) => a.businessId === activeId);
            const accountId = resolveImportBankAccountId(
              mode,
              bizAccounts,
              String(job.row["Payment Type"] ?? ""),
              null,
            );
            const acc = accountId ? bizAccounts.find((a) => a.id === accountId) : undefined;
            await createImportPayment(
              {
                businessId: activeId,
                partyId: job.savedInv.partyId || "_advance",
                direction: "in",
                date: job.importedDate,
                amount: job.payAmt,
                mode,
                accountId,
                account: acc?.name,
                reference: job.savedInv.number,
                notes: `Excel import receipt for ${job.savedInv.number}`,
                proofDataUrl: proof.proofDataUrl,
                proofName: proof.proofName,
                allocations: [
                  { docId: job.savedInv.id, docNumber: job.savedInv.number, amount: job.payAmt },
                ],
                excludeFromLedger: true,
              },
              USE_BACKEND ? { skipRefresh: true } : undefined,
            );
          } catch (payErr) {
            console.error(payErr);
            toast.warning(
              `${job.savedInv.number}: marked final but receipt was not posted to cash/bank. Record payment from the sale if needed.`,
            );
          }
        });
        if (USE_BACKEND) await refreshPaymentsAfterBulk();
      }

      created = preparedSales.length;

      if (created === 0) toast.error("No valid rows imported");
      else {
        if (importedDateKeys.length > 0) {
          const sorted = [...importedDateKeys].sort();
          setSearch({ from: sorted[0], to: sorted[sorted.length - 1] });
        }
        toast.success(
          `Bulk import successful: Imported ${created} final sales${skipped ? ` (${skipped} skipped)` : ""}${duplicates ? ` (${duplicates} duplicates)` : ""} • +${createdParties} parties • +${createdItems} items/assets`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bulk import failed";
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const currency = activeBusiness?.currency ?? "INR";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="max-w-screen-2xl px-6 py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {activeBusiness?.name ?? "Workspace"}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Sales</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {hydrated
                  ? `${totals.count} active • ${formatCurrency(totals.outstanding, currency)} outstanding`
                  : "Loading…"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" size="lg" className="gap-2">
                    <CircleHelp className="h-4 w-4" />
                    Import Columns
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Expected Sales Excel Columns</AlertDialogTitle>
                    <AlertDialogDescription>
                      Keep sheet names as <strong>Sale Report</strong> and{" "}
                      <strong>Item Details</strong> for best results.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="mb-1 font-medium text-foreground">Sale Report</p>
                      <p className="text-muted-foreground">{SALES_REPORT_HEADERS.join(", ")}</p>
                    </div>
                    <div>
                      <p className="mb-1 font-medium text-foreground">Item Details</p>
                      <p className="text-muted-foreground">{SALES_ITEM_HEADERS.join(", ")}</p>
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogAction>Got it</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="gap-2"
                disabled={importing}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".csv,.xlsx,.xls";
                  input.onchange = () => {
                    const file = input.files?.[0] ?? null;
                    void handleBulkImport(file);
                  };
                  input.click();
                }}
              >
                <Upload className="h-4 w-4" />
                {importing ? "Importing..." : "Bulk Import"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="lg"
                className="gap-2"
                disabled={selectedCount === 0}
                onClick={() => setShowBulkDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
                Bulk Delete{selectedCount ? ` (${selectedCount})` : ""}
              </Button>
              <Button asChild size="lg" className="gap-2">
                <Link to="/invoices/new">
                  <Plus className="h-4 w-4" />
                  Create Sale
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard label="Total Sale" value={formatCurrency(totals.total, currency)} />
            <SummaryCard
              label="Total received"
              value={formatCurrency(totals.paid, currency)}
              tone="success"
            />
            <SummaryCard
              label="Outstanding"
              value={formatCurrency(totals.outstanding, currency)}
              tone={totals.outstanding > 0 ? "destructive" : "muted"}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setSearch({ q: e.target.value })}
                placeholder="Search by invoice number or party…"
                className="h-11 pl-10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterGroup label="Status">
                {STATUS_FILTERS.map((f) => (
                  <FilterChip
                    key={f}
                    active={status === f}
                    onClick={() => setSearch({ status: f })}
                  >
                    {f === "all" ? "All" : STATUS_LABEL[f as InvoiceStatus]}
                  </FilterChip>
                ))}
              </FilterGroup>

              <FilterGroup label="Payment">
                {PAY_FILTERS.map((f) => (
                  <FilterChip
                    key={f}
                    active={payment === f}
                    onClick={() => setSearch({ payment: f })}
                  >
                    <span className="capitalize">{f}</span>
                  </FilterChip>
                ))}
              </FilterGroup>
              <FilterGroup label="Type">
                {TYPE_FILTERS.map((f) => (
                  <FilterChip key={f} active={type === f} onClick={() => setSearch({ type: f })}>
                    <span className="capitalize">
                      {f === "all" ? "All" : f === "subscription" ? "Subscription" : f}
                    </span>
                  </FilterChip>
                ))}
              </FilterGroup>

              <DateRange
                from={fromBoundary ?? undefined}
                to={toBoundary ?? undefined}
                onFrom={(d) => setSearch({ from: d ? format(d, "yyyy-MM-dd") : "" })}
                onTo={(d) => setSearch({ to: d ? format(d, "yyyy-MM-dd") : "" })}
              />
              <div className="min-w-[180px]">
                <Select
                  value={selectedMonthValue}
                  onValueChange={(v) => {
                    if (v === "custom") return;
                    const picked = monthOptions.find((m) => m.value === v);
                    if (picked) setSearch({ from: picked.from, to: picked.to });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl px-6 py-8">
        {hydrated && visible.length === 0 ? (
          <EmptyState filtered={invoices.length > 0} />
        ) : (
          <>
            <InvoicesTable
              invoices={listPg.pageItems}
              currency={currency}
              paymentTypeByInvoiceId={paymentTypeByInvoiceId}
              selectedIds={selectedIds}
              allSelected={allVisibleSelected}
              onToggleSelectAll={toggleSelectAllVisible}
              onToggleSelectOne={toggleSelectOne}
              onDelete={setDeleting}
              onCancel={setCancelling}
            />
            <ListPaginationBar
              page={listPg.page}
              totalPages={listPg.totalPages}
              totalCount={listPg.totalCount}
              rangeFrom={listPg.rangeFrom}
              rangeTo={listPg.rangeTo}
              onPageChange={listPg.setPage}
              className="mt-2 rounded-xl border border-border bg-card"
            />
          </>
        )}
      </main>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the invoice from your list. Past payments and ledger entries are kept
              for audit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!cancelling} onOpenChange={(v) => !v && setCancelling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {cancelling?.number}?</AlertDialogTitle>
            <AlertDialogDescription>
              Cancelled invoices remain visible but are excluded from receivables and totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep invoice</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>Cancel invoice</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected sales?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide {selectedCount} selected sales records from your list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "destructive" | "muted";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums",
          tone === "success" && "text-success",
          tone === "destructive" && "text-destructive",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        {children}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function DateRange({
  from,
  to,
  onFrom,
  onTo,
}: {
  from?: Date;
  to?: Date;
  onFrom: (d?: Date) => void;
  onTo: (d?: Date) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
      <DatePill label="From" value={from} onChange={onFrom} />
      <span className="px-1 text-xs text-muted-foreground">→</span>
      <DatePill label="To" value={to} onChange={onTo} />
      {(from || to) && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            onFrom(undefined);
            onTo(undefined);
          }}
          aria-label="Clear date range"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

function DatePill({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: Date;
  onChange: (d?: Date) => void;
}) {
  return (
    <DatePickerField
      variant="chip"
      placeholder={label}
      value={value}
      onChange={onChange}
      formatStr="dd/MM/yyyy"
      title={label}
    />
  );
}

function summarizePaymentBreakupJson(raw: string | null | undefined): string | null {
  const s = raw?.trim();
  if (!s) return null;
  try {
    const parsed = JSON.parse(s) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const entries = Object.entries(parsed as Record<string, unknown>).filter(([, v]) => {
      if (typeof v === "number") return v > 0;
      if (typeof v === "string") return Number(v) > 0;
      return false;
    });
    if (entries.length === 0) return null;
    if (entries.length === 1) return entries[0]![0];
    return entries.map(([k]) => k).join(" · ");
  } catch {
    return null;
  }
}

function formatInvoiceCardPaymentTypes(
  inv: Invoice,
  modesFromPayments: Set<string> | undefined,
): string {
  if (modesFromPayments && modesFromPayments.size > 0) {
    return modesFromPayments.size === 1 ? Array.from(modesFromPayments)[0]! : "Mixed";
  }
  const pt = inv.paymentType?.trim();
  if (pt) return pt;
  return summarizePaymentBreakupJson(inv.paymentBreakupJson) ?? "Not set";
}

function InvoicesTable({
  invoices,
  currency,
  paymentTypeByInvoiceId,
  selectedIds,
  allSelected,
  onToggleSelectAll,
  onToggleSelectOne,
  onDelete,
  onCancel,
}: {
  invoices: Invoice[];
  currency: string;
  paymentTypeByInvoiceId: Map<string, Set<string>>;
  selectedIds: Set<string>;
  allSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectOne: (id: string, checked: boolean) => void;
  onDelete: (i: Invoice) => void;
  onCancel: (i: Invoice) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="hidden grid-cols-[36px_120px_100px_1.6fr_110px_110px_110px_180px] items-center gap-3 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
        <span className="flex justify-center">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(v) => onToggleSelectAll(!!v)}
            aria-label="Select all sales"
          />
        </span>
        <span>Invoice</span>
        <span>Date</span>
        <span>Party / Type</span>
        <span className="text-right">Total</span>
        <span className="text-right">Paid</span>
        <span className="text-right">Balance</span>
        <span className="text-right">Status / Actions</span>
      </div>

      <ul className="divide-y divide-border">
        {invoices.map((inv) => {
          const balance = inv.total - inv.paidAmount;
          const pay = paymentStatusOf(inv);
          const cancelled = inv.status === "cancelled";
          const modes = paymentTypeByInvoiceId.get(inv.id);
          const paymentType = formatInvoiceCardPaymentTypes(inv, modes);
          return (
            <li
              key={inv.id}
              className="group grid grid-cols-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[36px_120px_100px_1.6fr_110px_110px_110px_180px] sm:gap-3"
            >
              <div className="flex justify-start sm:justify-center">
                <Checkbox
                  checked={selectedIds.has(inv.id)}
                  onCheckedChange={(v) => onToggleSelectOne(inv.id, !!v)}
                  aria-label={`Select ${inv.number}`}
                />
              </div>
              <Link
                to="/invoices/$id"
                params={{ id: inv.id }}
                className="font-mono text-sm font-semibold text-foreground hover:text-primary"
              >
                {inv.number}
              </Link>
              <span className="text-sm text-muted-foreground">
                {format(new Date(inv.date), "dd/MM/yyyy")}
              </span>
              <div>
                <Link
                  to="/parties/$id"
                  params={{ id: inv.partyId }}
                  className="truncate text-sm font-medium text-foreground hover:text-primary"
                >
                  {inv.partyName}
                </Link>
                <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                  {(inv.invoiceType ?? "standard") === "subscription"
                    ? "Subscription"
                    : (inv.invoiceType ?? "standard") === "advance"
                      ? "Advance"
                      : "Standard"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Payment type: {paymentType}</p>
              </div>
              <span className="text-right font-semibold tabular-nums">
                {formatCurrency(inv.total, currency)}
              </span>
              <span className="text-right tabular-nums text-muted-foreground">
                {formatCurrency(inv.paidAmount, currency)}
              </span>
              <span
                className={cn(
                  "text-right font-semibold tabular-nums",
                  cancelled && "text-muted-foreground line-through",
                  !cancelled && balance > 0 && "text-destructive",
                  !cancelled && balance <= 0 && "text-success",
                )}
              >
                {formatCurrency(balance, currency)}
              </span>

              <div className="flex items-start justify-start gap-2 sm:flex-col sm:items-end sm:justify-center sm:gap-1">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                      STATUS_BADGE[inv.status],
                    )}
                  >
                    {STATUS_LABEL[inv.status]}
                  </span>
                  {!cancelled && (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                        PAY_BADGE[pay],
                      )}
                    >
                      {pay}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-0.5 whitespace-nowrap">
                  {inv.status === "draft" && (
                    <Button
                      asChild
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label={`Edit ${inv.number}`}
                      title="Edit"
                    >
                      <Link to="/invoices/$id/edit" params={{ id: inv.id }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  {!cancelled && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-warning hover:bg-warning/10"
                      onClick={() => onCancel(inv)}
                      aria-label={`Cancel ${inv.number}`}
                      title="Cancel"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(inv)}
                    aria-label={`Delete ${inv.number}`}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-glow text-primary-foreground">
        <FileText className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">
        {filtered ? "No invoices match your filters" : "No invoices found"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {filtered
          ? "Try a different search term or clear the filters."
          : "Create your first invoice to start tracking sales and receivables."}
      </p>
      <Button asChild size="lg" className="mt-6 gap-2">
        <Link to="/invoices/new">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Link>
      </Button>
    </div>
  );
}
