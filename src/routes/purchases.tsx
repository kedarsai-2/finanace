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
  ShoppingCart,
  Ban,
  CalendarIcon,
  CircleHelp,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { useItems } from "@/hooks/useItems";
import { usePurchases } from "@/hooks/usePurchases";
import { formatCurrency, useParties } from "@/hooks/useParties";
import type { Purchase, PurchaseStatus } from "@/types/purchase";
import { computeTotals } from "@/types/invoice";
import { nextPurchaseNumber } from "@/types/purchase";
import {
  PURCHASE_ITEM_HEADERS,
  PURCHASE_REPORT_HEADERS,
  mapPurchaseItemRowToPurchaseLineFields,
  mapPurchaseReportRowToPurchaseFields,
} from "@/lib/expensePurchaseImportMapping";
import { parseSpreadsheetDate } from "@/lib/spreadsheetDates";
import { sheetToObjectsByHeaderMarker } from "@/lib/spreadsheetSheet";

function sheetToMatrix(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" }) as unknown[][];
}

function gridHasExactCell(grid: unknown[][], needle: string): boolean {
  const n = needle.trim().toLowerCase();
  for (const row of grid.slice(0, 50)) {
    if (!Array.isArray(row)) continue;
    for (const cell of row) {
      if (String(cell ?? "").trim().toLowerCase() === n) return true;
    }
  }
  return false;
}

/** Vyapar sheet names vary; locate the tab that actually contains purchase header cells. */
function findPurchaseMainSheet(workbook: XLSX.WorkBook): XLSX.WorkSheet | undefined {
  const markers = ["Party Name", "Supplier Name"];
  const preferred = ["Purchase Report", "Purchase report", "Purchases", "PurchaseReport"];
  for (const name of preferred) {
    const sh = workbook.Sheets[name];
    if (!sh) continue;
    const g = sheetToMatrix(sh);
    if (markers.some((m) => gridHasExactCell(g, m))) return sh;
  }
  for (const name of workbook.SheetNames) {
    const sh = workbook.Sheets[name];
    if (!sh) continue;
    const g = sheetToMatrix(sh);
    if (markers.some((m) => gridHasExactCell(g, m))) return sh;
  }
  return undefined;
}

function findPurchaseItemSheet(workbook: XLSX.WorkBook, mainSheet: XLSX.WorkSheet): XLSX.WorkSheet | undefined {
  const preferred = ["Item Details", "Purchase Item Details", "Item details"];
  for (const name of preferred) {
    const sh = workbook.Sheets[name];
    if (!sh || sh === mainSheet) continue;
    const g = sheetToMatrix(sh);
    if (gridHasExactCell(g, "Item Name")) return sh;
  }
  for (const name of workbook.SheetNames) {
    const sh = workbook.Sheets[name];
    if (!sh || sh === mainSheet) continue;
    const g = sheetToMatrix(sh);
    if (gridHasExactCell(g, "Item Name")) return sh;
  }
  return undefined;
}

function purchasePaymentTypeLabel(mode?: Purchase["purchasePaymentMode"]) {
  if (mode === "cash") return "Cash";
  if (mode === "bank") return "Bank";
  if (mode === "cheque") return "Cheque";
  return "Not set";
}

function purchaseCategoryLabel(category?: Purchase["purchaseCategory"]) {
  if (category === "long-term") return "Long-term";
  if (category === "short-term") return "Short-term";
  return "Not set";
}

const STATUS_FILTERS = ["all", "draft", "final", "cancelled"] as const;
const DEFAULT_FROM = format(startOfMonth(new Date()), "yyyy-MM-dd");
const DEFAULT_TO = format(endOfMonth(new Date()), "yyyy-MM-dd");
type StatusFilter = (typeof STATUS_FILTERS)[number];

const searchSchema = z.object({
  q: z.string().catch("").default(""),
  status: z.enum(STATUS_FILTERS).catch("all").default("all"),
  from: z.string().catch(DEFAULT_FROM).default(DEFAULT_FROM),
  to: z.string().catch(DEFAULT_TO).default(DEFAULT_TO),
});

type SearchValues = z.infer<typeof searchSchema>;

function safeDateTs(value?: string) {
  const ts = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(ts) ? ts : 0;
}

function safeFormatDate(value?: string) {
  const d = value ? new Date(value) : null;
  return d && Number.isFinite(d.getTime()) ? format(d, "dd/MM/yyyy") : "—";
}

export const Route = createFileRoute("/purchases")({
  validateSearch: (search: Partial<SearchValues> & SearchSchemaInput): SearchValues =>
    searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Purchases - QOBOX" },
      {
        name: "description",
        content: "Manage all your purchase bills. Track totals and supplier payables.",
      },
    ],
  }),
  component: PurchasesRouteLayout,
});

const STATUS_LABEL: Record<PurchaseStatus, string> = {
  draft: "Draft",
  final: "Final",
  cancelled: "Cancelled",
};

const STATUS_BADGE: Record<PurchaseStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  final: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

function PurchasesRouteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/purchases") return <Outlet />;
  return <PurchasesPage />;
}

function PurchasesPage() {
  const navigate = useNavigate({ from: "/purchases" });
  const { q, status, from, to } = Route.useSearch();
  const { activeId, scopedBusinessId, businesses } = useBusinesses();
  const { purchases, hydrated, upsert, remove, cancel } = usePurchases(scopedBusinessId);
  const { parties, upsert: upsertParty } = useParties(scopedBusinessId);
  const { items, upsert: upsertItem } = useItems(scopedBusinessId);
  const activeBusiness = businesses.find((b) => b.id === activeId);

  const [deleting, setDeleting] = useState<Purchase | null>(null);
  const [cancelling, setCancelling] = useState<Purchase | null>(null);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const fromDate = from ? new Date(from) : undefined;
  const toDate = to ? new Date(to) : undefined;

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return purchases
      .filter((p) => {
        if (status !== "all" && p.status !== status) return false;
        const d = safeDateTs(p.date);
        if (fromDate && d < fromDate.setHours(0, 0, 0, 0)) return false;
        if (toDate && d > toDate.setHours(23, 59, 59, 999)) return false;
        if (!term) return true;
        return p.number.toLowerCase().includes(term) || p.partyName.toLowerCase().includes(term);
      })
      .sort((a, b) => safeDateTs(b.date) - safeDateTs(a.date));
  }, [purchases, q, status, fromDate, toDate]);

  const listPgKey = useMemo(() => `${q}|${status}|${from}|${to}`, [q, status, from, to]);
  const listPg = useListPagination(visible, listPgKey);

  const totals = useMemo(() => {
    let total = 0;
    let paid = 0;
    let balance = 0;
    let count = 0;
    for (const p of purchases) {
      if (p.status === "cancelled") continue;
      total += p.total;
      paid += Math.max(0, p.paidAmount ?? 0);
      balance += Math.max(0, p.total - (p.paidAmount ?? 0));
      count += 1;
    }
    return { total, paid, balance, count };
  }, [purchases]);

  const setSearch = (next: Partial<SearchValues>) =>
    navigate({ search: (prev: SearchValues) => ({ ...prev, ...next }) });
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
  const allVisibleSelected =
    listPg.pageItems.length > 0 && listPg.pageItems.every((p) => selectedIds.has(p.id));
  const selectedCount = visible.filter((p) => selectedIds.has(p.id)).length;

  const toggleSelectAllVisible = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) listPg.pageItems.forEach((p) => next.add(p.id));
      else listPg.pageItems.forEach((p) => next.delete(p.id));
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

  const parsePaymentMode = (raw: unknown): Purchase["purchasePaymentMode"] => {
    const v = String(raw ?? "").trim().toLowerCase();
    if (v.includes("cheque") || v.includes("check")) return "cheque";
    if (v.includes("bank") || v.includes("upi") || v.includes("online") || v.includes("card"))
      return "bank";
    return "cash";
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
      const mainSheet = findPurchaseMainSheet(workbook);
      if (!mainSheet) {
        throw new Error(
          'No purchase sheet found. Expect a worksheet with a "Party Name" or "Supplier Name" column (Vyapar-style Purchase Report).',
        );
      }
      const itemSheet = findPurchaseItemSheet(workbook, mainSheet);

      const purchasePartyMarkers = ["Party Name", "Supplier Name"];
      const rows = sheetToObjectsByHeaderMarker(mainSheet, purchasePartyMarkers);
      const itemRows = itemSheet ? sheetToObjectsByHeaderMarker(itemSheet, "Item Name") : [];
      if (rows.length === 0) throw new Error("File has no rows");

      const linesByRef = new Map<string, Purchase["lines"]>();
      for (const row of itemRows) {
        const ref = String(row["Invoice No./Txn No."] ?? row["Challan/Order No."] ?? "")
          .trim()
          .toLowerCase();
        if (!ref) continue;
        const mapped = mapPurchaseItemRowToPurchaseLineFields(row);
        const line = {
          id: `pl_${Math.random().toString(36).slice(2, 9)}`,
          name: mapped.name || "Imported line",
          qty: mapped.qty ?? 1,
          unit: mapped.unit ?? "pcs",
          rate: mapped.rate ?? 0,
          discountKind: "percent" as const,
          discountValue: mapped.discountValue ?? 0,
          taxPercent: mapped.taxPercent ?? 0,
          hsnSac: mapped.hsnSac,
          category: mapped.category,
          challanOrderNo: mapped.challanOrderNo,
          taxAmount: mapped.taxAmount,
          transactionType: mapped.transactionType,
          lineAmount: mapped.lineAmount,
        };
        const list = linesByRef.get(ref) ?? [];
        list.push(line);
        linesByRef.set(ref, list);
      }

      let created = 0;
      let skipped = 0;
      let duplicates = 0;
      let createdParties = 0;
      let createdItems = 0;
      const existingForNumber = purchases.map((p) => ({ number: p.number, businessId: p.businessId }));
      const partiesByName = new Map(
        parties
          .filter((p) => p.businessId === activeId)
          .map((p) => [p.name.trim().toLowerCase(), p] as const),
      );
      const itemNames = new Set(items.map((it) => it.name.trim().toLowerCase()).filter(Boolean));
      const purchaseKeys = new Set(
        purchases.map((p) => {
          const dateKey = format(new Date(p.date), "yyyy-MM-dd");
          const partyKey = p.partyName.trim().toLowerCase();
          const orderKey = (p.orderNo ?? "").trim().toLowerCase();
          const invoiceKey = (p.invoiceNo ?? "").trim().toLowerCase();
          return `${dateKey}|${partyKey}|${orderKey}|${invoiceKey}|${Number(p.total).toFixed(2)}`;
        }),
      );
      for (const row of rows) {
        const partyName = String(
          row["Party Name"] ?? row["Supplier Name"] ?? row["Supplier"] ?? "",
        ).trim();
        if (!partyName) {
          skipped += 1;
          continue;
        }
        const partyNameKey = partyName.toLowerCase();
        let party = partiesByName.get(partyNameKey);
        if (!party) {
          const savedParty = await upsertParty({
            id: "",
            businessId: activeId,
            name: partyName,
            mobile: normalizeMobile(row["Party Phone No."]) ?? "",
            gstNumber: String(row["GSTIN"] ?? "").trim() || undefined,
            state: String(row["State"] ?? "").trim() || undefined,
            city: String(row["City"] ?? "").trim() || undefined,
            openingBalance: 0,
            balance: 0,
          });
          party = savedParty;
          partiesByName.set(partyNameKey, savedParty);
          createdParties += 1;
        }

        const mapped = mapPurchaseReportRowToPurchaseFields(row);
        const importedDate = parseSpreadsheetDate(row["Date"]);
        const importedDateKey = format(new Date(importedDate), "yyyy-MM-dd");
        const orderKey = String(mapped.orderNo ?? "").trim().toLowerCase();
        const invoiceKey = String(mapped.invoiceNo ?? "").trim().toLowerCase();
        const totalKey = Number(mapped.total ?? 0).toFixed(2);
        const purchaseKey = `${importedDateKey}|${partyNameKey}|${orderKey}|${invoiceKey}|${totalKey}`;
        if (purchaseKeys.has(purchaseKey)) {
          duplicates += 1;
          continue;
        }
        const refA = String(row["Invoice No"] ?? "").trim().toLowerCase();
        const refB = String(row["Order No"] ?? "").trim().toLowerCase();
        const sourceLines = (refA && linesByRef.get(refA)) || (refB && linesByRef.get(refB)) || [];
        const fallbackTotal = Number(mapped.total ?? 0);
        const lines =
          sourceLines.length > 0
            ? sourceLines
            : [
                {
                  id: `pl_${Math.random().toString(36).slice(2, 9)}`,
                  name: "Imported line",
                  qty: 1,
                  unit: "pcs",
                  rate: fallbackTotal,
                  discountKind: "percent" as const,
                  discountValue: 0,
                  taxPercent: 0,
                },
              ];
        for (const line of lines) {
          const itemNameKey = line.name.trim().toLowerCase();
          if (!itemNameKey || itemNameKey === "imported line" || itemNames.has(itemNameKey)) continue;
          await upsertItem({
            id: "",
            businessId: activeId,
            name: line.name,
            type: "product",
            sku: undefined,
            sellingPrice: Number(line.rate ?? 0),
            purchasePrice: Number(line.rate ?? 0),
            taxPercent: Number(line.taxPercent ?? 0),
            unit: String(line.unit ?? "pcs"),
            active: true,
          });
          itemNames.add(itemNameKey);
          createdItems += 1;
        }

        const computed = computeTotals({
          lines,
          overallDiscountKind: "percent",
          overallDiscountValue: 0,
        });
        const total = fallbackTotal > 0 ? fallbackTotal : computed.total;
        const paidAmount = Number(mapped.paidAmount ?? 0);
        const number = nextPurchaseNumber(existingForNumber, activeId);
        existingForNumber.push({ number, businessId: activeId });

        await upsert({
          id: `pur_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          businessId: activeId,
          number,
          orderNo: mapped.orderNo,
          invoiceNo: mapped.invoiceNo,
          date: importedDate,
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
          status: "draft",
          notes: mapped.notes,
          purchaseCategory: "short-term",
          purchasePaymentMode: parsePaymentMode(row["Payment Type"]),
          createdAt: new Date().toISOString(),
        });
        purchaseKeys.add(purchaseKey);
        created += 1;
      }

      if (created === 0) {
        toast.error("No valid rows imported.");
      } else {
        toast.success(
          `Imported ${created} purchases${skipped ? ` (${skipped} skipped)` : ""}${duplicates ? ` (${duplicates} duplicates)` : ""} • +${createdParties} parties • +${createdItems} items/assets`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bulk import failed";
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    if (!verifyActionPassword()) return;
    const n = deleting.number;
    try {
      await remove(deleting.id);
      setDeleting(null);
      toast.success(`Deleted ${n}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete purchase";
      toast.error(message);
    }
  };

  const confirmBulkDelete = async () => {
    const ids = visible.map((p) => p.id).filter((id) => selectedIds.has(id));
    if (!ids.length) return;
    if (!verifyActionPassword()) return;
    try {
      for (const id of ids) {
        await remove(id);
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      setShowBulkDeleteConfirm(false);
      toast.success(`Deleted ${ids.length} purchases`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete selected purchases";
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
      const message = err instanceof Error ? err.message : "Could not cancel purchase";
      toast.error(message);
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
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Purchases</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {hydrated
                  ? `${totals.count} active • ${formatCurrency(totals.total, currency)} billed`
                  : "Loading…"}
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <Link to="/purchases/new">
                <Plus className="h-4 w-4" />
                Add Purchase
              </Link>
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="outline" size="lg" className="gap-2">
                  <CircleHelp className="h-4 w-4" />
                  Import Columns
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Expected Purchase Excel Columns</AlertDialogTitle>
                  <AlertDialogDescription>
                    Keep sheet names as <strong>Purchase Report</strong> and{" "}
                    <strong>Item Details</strong> for best results.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="mb-1 font-medium text-foreground">Purchase Report</p>
                    <p className="text-muted-foreground">{PURCHASE_REPORT_HEADERS.join(", ")}</p>
                  </div>
                  <div>
                    <p className="mb-1 font-medium text-foreground">Item Details</p>
                    <p className="text-muted-foreground">{PURCHASE_ITEM_HEADERS.join(", ")}</p>
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
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard label="Total purchases" value={String(totals.count)} />
            <SummaryCard label="Total" value={formatCurrency(totals.total, currency)} />
            <SummaryCard
              label="Paid / Balance"
              value={`${formatCurrency(totals.paid, currency)} / ${formatCurrency(totals.balance, currency)}`}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setSearch({ q: e.target.value })}
                placeholder="Search by purchase number or supplier…"
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
                    {f === "all" ? "All" : STATUS_LABEL[f as PurchaseStatus]}
                  </FilterChip>
                ))}
              </FilterGroup>

              <DateRange
                from={fromDate}
                to={toDate}
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
          <EmptyState filtered={purchases.length > 0} />
        ) : (
          <>
            <PurchasesTable
              purchases={listPg.pageItems}
              currency={currency}
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
              This hides the purchase from your list. Records are kept for audit.
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
              Cancelled purchases stay visible but are excluded from payables and totals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep purchase</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>Cancel purchase</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected purchases?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete {selectedCount} selected purchases.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
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
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
            value ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {value ? format(value, "dd/MM/yyyy") : label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

function PurchasesTable({
  purchases,
  currency,
  selectedIds,
  allSelected,
  onToggleSelectAll,
  onToggleSelectOne,
  onDelete,
  onCancel,
}: {
  purchases: Purchase[];
  currency: string;
  selectedIds: Set<string>;
  allSelected: boolean;
  onToggleSelectAll: (checked: boolean) => void;
  onToggleSelectOne: (id: string, checked: boolean) => void;
  onDelete: (p: Purchase) => void;
  onCancel: (p: Purchase) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="hidden grid-cols-[36px_140px_110px_1.2fr_120px_120px_120px_220px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
        <span className="flex justify-center">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(v) => onToggleSelectAll(!!v)}
            aria-label="Select all purchases"
          />
        </span>
        <span>Purchase</span>
        <span>Date</span>
        <span>Supplier</span>
        <span className="text-right">Total</span>
        <span className="text-right">Paid</span>
        <span className="text-right">Balance</span>
        <span className="text-right">Status / Actions</span>
      </div>

      <ul className="divide-y divide-border">
        {purchases.map((p) => {
          const cancelled = p.status === "cancelled";
          return (
            <li
              key={p.id}
              className="group grid grid-cols-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[36px_140px_110px_1.2fr_120px_120px_120px_220px]"
            >
              <div className="flex justify-start sm:justify-center">
                <Checkbox
                  checked={selectedIds.has(p.id)}
                  onCheckedChange={(v) => onToggleSelectOne(p.id, !!v)}
                  aria-label={`Select purchase ${p.number}`}
                />
              </div>
              <Link
                to="/purchases/$id"
                params={{ id: p.id }}
                className="font-mono text-sm font-semibold text-foreground hover:text-primary"
              >
                {p.number}
              </Link>
              <span className="text-sm text-muted-foreground">{safeFormatDate(p.date)}</span>
              <div className="min-w-0">
                <Link
                  to="/parties/$id"
                  params={{ id: p.partyId }}
                  className="truncate text-sm font-medium text-foreground hover:text-primary"
                >
                  {p.partyName}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Purchase type: {purchaseCategoryLabel(p.purchaseCategory)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Payment type: {purchasePaymentTypeLabel(p.purchasePaymentMode)}
                </p>
              </div>
              <span
                className={cn(
                  "text-right font-semibold tabular-nums",
                  cancelled && "text-muted-foreground line-through",
                )}
              >
                {formatCurrency(p.total, currency)}
              </span>
              <span
                className={cn(
                  "text-right tabular-nums",
                  cancelled && "text-muted-foreground line-through",
                )}
              >
                {formatCurrency(p.paidAmount ?? 0, currency)}
              </span>
              <span
                className={cn(
                  "text-right font-semibold tabular-nums",
                  cancelled && "text-muted-foreground line-through",
                )}
              >
                {formatCurrency(Math.max(0, p.total - (p.paidAmount ?? 0)), currency)}
              </span>

              <div className="flex items-center justify-start gap-1.5 sm:justify-end">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
                    STATUS_BADGE[p.status],
                  )}
                >
                  {STATUS_LABEL[p.status]}
                </span>

                <div className="ml-1 flex items-center gap-0.5 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                  {p.status === "draft" && (
                    <Button
                      asChild
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      aria-label={`Edit ${p.number}`}
                      title="Edit"
                    >
                      <Link to="/purchases/$id/edit" params={{ id: p.id }}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  {!cancelled && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-warning hover:bg-warning/10"
                      onClick={() => onCancel(p)}
                      aria-label={`Cancel ${p.number}`}
                      title="Cancel"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(p)}
                    aria-label={`Delete ${p.number}`}
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
        <ShoppingCart className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">
        {filtered ? "No purchases match your filters" : "No purchases found"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {filtered
          ? "Try a different search term or clear the filters."
          : "Record your first purchase to track supplier bills and payables."}
      </p>
      <Button asChild size="lg" className="mt-6 gap-2">
        <Link to="/purchases/new">
          <Plus className="h-4 w-4" />
          Add Purchase
        </Link>
      </Button>
    </div>
  );
}
