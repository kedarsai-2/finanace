import { Outlet, createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useListPagination } from "@/hooks/useListPagination";
import { ListPaginationBar } from "@/components/ui/ListPaginationBar";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import {
  CalendarIcon,
  CircleHelp,
  Plus,
  Receipt,
  Search,
  Tags,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAccounts } from "@/hooks/useAccounts";
import { useExpenses } from "@/hooks/useExpenses";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { useItems } from "@/hooks/useItems";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { QuickAddExpenseDialog } from "@/components/expense/QuickAddExpenseDialog";
import { DEFAULT_EXPENSE_TYPES, type Expense } from "@/types/expense";
import {
  EXPENSE_ITEM_HEADERS,
  EXPENSE_REPORT_HEADERS,
  mapExpenseItemRowToExpenseFields,
  mapExpenseReportRowToExpenseFields,
} from "@/lib/expensePurchaseImportMapping";
import {
  parseSpreadsheetPaymentMode,
  resolveImportBankAccountId,
} from "@/lib/spreadsheetImportLedger";
import { parseSpreadsheetDate } from "@/lib/spreadsheetDates";

const LAST_ACCOUNT_KEY = "bm.expenses.lastAccount";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses - QOBOX" },
      {
        name: "description",
        content: "Search, filter and manage all business expenses by category, account and date.",
      },
    ],
  }),
  component: ExpensesRouteLayout,
});

function ExpensesRouteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/expenses") return <Outlet />;
  return <ExpensesPage />;
}

function ExpensesPage() {
  const { activeId, businesses } = useBusinesses();
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";

  const { accounts } = useAccounts(activeId, []);
  const safeAccounts = useMemo(
    () =>
      accounts.filter((a) => {
        if (!a.id) return false;
        if (!activeId) return true;
        return a.businessId === activeId;
      }),
    [accounts, activeId],
  );
  const { parties, upsert: upsertParty } = useParties(activeId);
  const { categories, upsert: upsertCategory } = useExpenseCategories(activeId);
  const { items, upsert: upsertItem } = useItems(activeId);
  const { expenses, add, remove } = useExpenses(activeId);

  const accountById = useMemo(
    () => Object.fromEntries(safeAccounts.map((a) => [a.id, a])),
    [safeAccounts],
  );
  const partyById = useMemo(() => Object.fromEntries(parties.map((p) => [p.id, p])), [parties]);

  const formatExpenseAccount = useCallback(
    (e: Expense) => {
      if (!e.mode || e.mode === "cash") return "Cash";
      const accName = e.accountId ? accountById[e.accountId]?.name : undefined;
      if (accName) return accName;
      return e.mode === "cheque" ? "Cheque" : "Bank";
    },
    [accountById],
  );

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [from, setFrom] = useState<Date | undefined>(startOfMonth(new Date()));
  const [to, setTo] = useState<Date | undefined>(endOfMonth(new Date()));
  const [showQuick, setShowQuick] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, idx) => {
        const d = subMonths(new Date(), idx);
        return {
          value: format(d, "yyyy-MM"),
          label: format(d, "MMMM yyyy"),
          from: startOfMonth(d),
          to: endOfMonth(d),
        };
      }),
    [],
  );
  const selectedMonthValue = useMemo(() => {
    if (!from || !to) return "custom";
    const fromKey = format(from, "yyyy-MM-dd");
    const toKey = format(to, "yyyy-MM-dd");
    const hit = monthOptions.find(
      (m) => format(m.from, "yyyy-MM-dd") === fromKey && format(m.to, "yyyy-MM-dd") === toKey,
    );
    return hit?.value ?? "custom";
  }, [from, to, monthOptions]);

  const normalizeMobile = (raw: unknown): string | undefined => {
    const digits = String(raw ?? "").replace(/\D/g, "");
    return /^[6-9]\d{9}$/.test(digits) ? digits : undefined;
  };

  const normalizeDedupeFragment = (raw: unknown): string =>
    String(raw ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

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
      const mainSheet =
        workbook.Sheets["Expense Report"] ?? workbook.Sheets[workbook.SheetNames[0]];
      if (!mainSheet) throw new Error("No sheet found in file");

      const itemSheet = workbook.Sheets["Item Details"] ?? workbook.Sheets["Expense Item Details"];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(mainSheet, { defval: "" });
      const itemRows = itemSheet
        ? XLSX.utils.sheet_to_json<Record<string, unknown>>(itemSheet, { defval: "" })
        : [];
      if (rows.length === 0) throw new Error("File has no rows");

      const itemMetaByKey = new Map<string, Record<string, unknown>>();
      for (const row of itemRows) {
        const dateKey = format(new Date(parseSpreadsheetDate(row["Date"])), "yyyy-MM-dd");
        const party = String(row["Party Name"] ?? "")
          .trim()
          .toLowerCase();
        const orderNo = String(row["Order No."] ?? row["Order No"] ?? "")
          .trim()
          .toLowerCase();
        const invoiceNo = String(row["Invoice No"] ?? row["Invoice No."] ?? "")
          .trim()
          .toLowerCase();
        for (const ref of [orderNo, invoiceNo].filter(Boolean)) {
          const k = `${dateKey}|${ref}|${party}`;
          if (!itemMetaByKey.has(k)) itemMetaByKey.set(k, row);
        }
      }

      let created = 0;
      let skipped = 0;
      let duplicates = 0;
      let createdParties = 0;
      let createdCategories = 0;
      let createdItems = 0;
      const partiesByName = new Map(
        parties
          .filter((p) => p.businessId === activeId)
          .map((p) => [p.name.trim().toLowerCase(), p] as const),
      );
      const categoriesByName = new Map(
        categories.map((c) => [c.name.trim().toLowerCase(), c] as const),
      );
      const itemNames = new Set(items.map((it) => it.name.trim().toLowerCase()).filter(Boolean));
      const expenseKeys = new Set(
        expenses.flatMap((e) => {
          const dateKey = format(new Date(e.date), "yyyy-MM-dd");
          const partyKey =
            (e.partyId ? partyById[e.partyId]?.name : "")?.trim().toLowerCase() ?? "";
          const refKey = (e.reference ?? "").trim().toLowerCase();
          const amt = Number(e.amount).toFixed(2);
          const base = `${dateKey}|${partyKey}|${refKey}|${amt}`;
          const cat = normalizeDedupeFragment(e.category);
          const notes = normalizeDedupeFragment(e.notes);
          const richNoPay = `${base}|${cat}||${notes}`;
          const keys = [richNoPay];
          if (partyKey || refKey) keys.push(base);
          return keys;
        }),
      );
      for (const row of rows) {
        const mapped = mapExpenseReportRowToExpenseFields(row);
        const amount = Number(mapped.amount ?? 0);
        if (!(amount > 0)) {
          skipped += 1;
          continue;
        }
        const importedDate = parseSpreadsheetDate(row["Date"]);
        const importedDateKey = format(new Date(importedDate), "yyyy-MM-dd");
        const partyK = String(row["Party Name"] ?? "")
          .trim()
          .toLowerCase();
        const invoiceK = String(row["Invoice No"] ?? row["Invoice No."] ?? "")
          .trim()
          .toLowerCase();
        const orderK = String(row["Order No"] ?? row["Order No."] ?? "")
          .trim()
          .toLowerCase();
        const itemMeta =
          (invoiceK && itemMetaByKey.get(`${importedDateKey}|${invoiceK}|${partyK}`)) ||
          (orderK && itemMetaByKey.get(`${importedDateKey}|${orderK}|${partyK}`)) ||
          undefined;
        const itemMapped = itemMeta ? mapExpenseItemRowToExpenseFields(itemMeta) : {};

        const partyNameRaw = String(row["Party Name"] ?? "").trim();
        const partyNameKey = partyNameRaw.toLowerCase();
        let party = partyNameKey ? partiesByName.get(partyNameKey) : undefined;
        if (!party && partyNameRaw) {
          const savedParty = await upsertParty({
            id: "",
            businessId: activeId,
            name: partyNameRaw,
            mobile: normalizeMobile(row["Party Phone No."] ?? row["Phone"]) ?? "",
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
        const category =
          (mapped.category ?? "").trim() || (itemMapped.category ?? "").trim() || "Imported";
        const dedupePartyKey = partyNameRaw.trim().toLowerCase();
        const dedupeRefKey = String(mapped.reference ?? "")
          .trim()
          .toLowerCase();
        const catFrag = normalizeDedupeFragment(category);
        const payFrag = normalizeDedupeFragment(row["Payment Type"]);
        const notesFrag = normalizeDedupeFragment(mapped.notes);
        const baseOnly = `${importedDateKey}|${dedupePartyKey}|${dedupeRefKey}|${Number(amount).toFixed(2)}`;
        const richNoPay = `${baseOnly}|${catFrag}||${notesFrag}`;
        const fullKey = `${baseOnly}|${catFrag}|${payFrag}|${notesFrag}`;
        const isDup =
          expenseKeys.has(fullKey) ||
          (!payFrag && expenseKeys.has(richNoPay)) ||
          ((dedupePartyKey || dedupeRefKey) && expenseKeys.has(baseOnly));
        if (isDup) {
          duplicates += 1;
          continue;
        }
        const payMode = parseSpreadsheetPaymentMode(row["Payment Type"]);
        const importedAccountId = resolveImportBankAccountId(
          payMode,
          safeAccounts,
          String(row["Payment Type"] ?? ""),
          LAST_ACCOUNT_KEY,
        );

        const categoryKey = category.toLowerCase();
        if (category && !categoriesByName.has(categoryKey)) {
          const savedCategory = await upsertCategory({
            id: "",
            businessId: activeId,
            name: category,
            createdAt: new Date().toISOString(),
          });
          categoriesByName.set(categoryKey, savedCategory);
          createdCategories += 1;
        }
        const itemName = (itemMapped.itemName ?? "").trim();
        const itemNameKey = itemName.toLowerCase();
        if (itemName && !itemNames.has(itemNameKey)) {
          await upsertItem({
            id: "",
            businessId: activeId,
            name: itemName,
            type: "product",
            sku: String(itemMeta?.["Item Code"] ?? "").trim() || undefined,
            sellingPrice: Number(itemMapped.unitPrice ?? itemMapped.lineAmount ?? amount ?? 0),
            purchasePrice: Number(itemMapped.unitPrice ?? itemMapped.lineAmount ?? amount ?? 0),
            taxPercent: Number(itemMapped.taxPercent ?? 0),
            unit: String(itemMeta?.["Unit"] ?? "pcs").trim() || "pcs",
            description: itemMapped.itemDescription,
            active: true,
          });
          itemNames.add(itemNameKey);
          createdItems += 1;
        }

        await add({
          id: `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
          businessId: activeId,
          accountId: importedAccountId,
          date: importedDate,
          amount,
          type: "indirect",
          category,
          partyId: party?.id,
          mode: payMode,
          reference: mapped.reference,
          notes: mapped.notes,
          receivedPaidAmount: mapped.receivedPaidAmount,
          balanceDue: mapped.balanceDue,
          orderNo: itemMapped.orderNo,
          itemName: itemMapped.itemName,
          itemDescription: itemMapped.itemDescription,
          hsnSac: itemMapped.hsnSac,
          quantity: itemMapped.quantity,
          unitPrice: itemMapped.unitPrice,
          discountPercent: itemMapped.discountPercent,
          discountAmount: itemMapped.discountAmount,
          taxPercent: itemMapped.taxPercent,
          taxAmount: itemMapped.taxAmount,
          lineAmount: itemMapped.lineAmount,
          createdAt: new Date().toISOString(),
          excludeFromLedger: true,
        });
        expenseKeys.add(fullKey);
        if (!payFrag) expenseKeys.add(richNoPay);
        if (dedupePartyKey || dedupeRefKey) expenseKeys.add(baseOnly);
        created += 1;
      }

      if (created === 0) toast.error("No valid rows imported");
      else
        toast.success(
          `Imported ${created} expenses (posted)${skipped ? ` (${skipped} skipped)` : ""}${duplicates ? ` (${duplicates} duplicates)` : ""} • +${createdParties} parties • +${createdCategories} categories • +${createdItems} items/assets`,
        );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bulk import failed";
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => {
        if (typeFilter !== "all" && e.type !== typeFilter) return false;
        if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
        if (accountFilter !== "all" && e.accountId !== accountFilter) return false;
        const t = new Date(e.date).getTime();
        if (from && t < from.setHours(0, 0, 0, 0)) return false;
        if (to && t > to.setHours(23, 59, 59, 999)) return false;
        if (q) {
          const needle = q.toLowerCase();
          const partyName = e.partyId ? (partyById[e.partyId]?.name.toLowerCase() ?? "") : "";
          const hay =
            `${e.notes ?? ""} ${e.reference ?? ""} ${partyName} ${e.category}`.toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, typeFilter, categoryFilter, accountFilter, from, to, q, partyById]);

  const paginationKey = useMemo(
    () =>
      `${q}|${typeFilter}|${categoryFilter}|${accountFilter}|${from?.getTime() ?? ""}|${to?.getTime() ?? ""}`,
    [q, typeFilter, categoryFilter, accountFilter, from, to],
  );
  const pg = useListPagination(filtered, paginationKey);

  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const allVisibleSelected =
    pg.pageItems.length > 0 && pg.pageItems.every((e) => selectedIds.has(e.id));
  const selectedCount = filtered.filter((e) => selectedIds.has(e.id)).length;

  const clearFilters = () => {
    setQ("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setAccountFilter("all");
    setFrom(undefined);
    setTo(undefined);
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        pg.pageItems.forEach((e) => next.add(e.id));
      } else {
        pg.pageItems.forEach((e) => next.delete(e.id));
      }
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

  const bulkDelete = async () => {
    const ids = filtered.map((e) => e.id).filter((id) => selectedIds.has(id));
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
      toast.success(`Deleted ${ids.length} expenses`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete selected expenses";
      toast.error(message);
    }
  };

  return (
    <div className="max-w-screen-2xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Business outflows
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {filtered.length} entries • Total{" "}
            <span className="font-semibold text-foreground">{formatCurrency(total, currency)}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/categories/expense">
              <Tags className="h-4 w-4" /> Categories
            </Link>
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setShowQuick(true)}>
            <Zap className="h-4 w-4" /> Quick add
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" className="gap-2">
                <CircleHelp className="h-4 w-4" />
                Import Columns
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Expected Expense Excel Columns</AlertDialogTitle>
                <AlertDialogDescription>
                  Keep sheet names as <strong>Expense Report</strong> and{" "}
                  <strong>Item Details</strong> for best results.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="mb-1 font-medium text-foreground">Expense Report</p>
                  <p className="text-muted-foreground">{EXPENSE_REPORT_HEADERS.join(", ")}</p>
                </div>
                <div>
                  <p className="mb-1 font-medium text-foreground">Item Details</p>
                  <p className="text-muted-foreground">{EXPENSE_ITEM_HEADERS.join(", ")}</p>
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
            className="gap-2"
            disabled={selectedCount === 0}
            onClick={() => setShowBulkDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4" />
            Bulk Delete{selectedCount ? ` (${selectedCount})` : ""}
          </Button>
          <Button asChild className="gap-2">
            <Link to="/expenses/new">
              <Plus className="h-4 w-4" /> Add Expense
            </Link>
          </Button>
        </div>
      </header>

      {/* Filter bar */}
      <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-12">
        <div className="relative sm:col-span-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes, reference or party"
            className="pl-8"
          />
        </div>
        <div className="sm:col-span-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {DEFAULT_EXPENSE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t === "direct" ? "Direct" : "Indirect"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-1">
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {safeAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2">
          <DateField label="From" value={from} onChange={setFrom} />
        </div>
        <div className="sm:col-span-2">
          <DateField label="To" value={to} onChange={setTo} />
        </div>
        <div className="sm:col-span-2">
          <Select
            value={selectedMonthValue}
            onValueChange={(v) => {
              if (v === "custom") return;
              const picked = monthOptions.find((m) => m.value === v);
              if (picked) {
                setFrom(picked.from);
                setTo(picked.to);
              }
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

      {(q ||
        typeFilter !== "all" ||
        categoryFilter !== "all" ||
        accountFilter !== "all" ||
        from ||
        to) && (
        <div className="mb-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Receipt className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">No expenses recorded</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Track your outflows to keep account balances accurate.
            </p>
            <Button asChild className="mt-4 gap-2">
              <Link to="/expenses/new">
                <Plus className="h-4 w-4" /> Add Expense
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="w-10 px-2 py-3 text-center">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(v) => toggleSelectAllVisible(!!v)}
                      aria-label="Select all on this page"
                    />
                  </th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Party</th>
                  <th className="px-4 py-3 text-left">Account</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="w-10 px-2 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pg.pageItems.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-2 py-3 text-center">
                      <Checkbox
                        checked={selectedIds.has(e.id)}
                        onCheckedChange={(v) => toggleSelectOne(e.id, !!v)}
                        aria-label={`Select expense ${e.id}`}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      <Link
                        to="/expenses/$id"
                        params={{ id: e.id }}
                        className="hover:text-foreground"
                      >
                        {format(new Date(e.date), "dd/MM/yyyy")}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link to="/expenses/$id" params={{ id: e.id }} className="hover:underline">
                        {e.type === "direct" ? "Direct" : "Indirect"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link to="/expenses/$id" params={{ id: e.id }} className="hover:underline">
                        {e.category}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {e.partyId ? (partyById[e.partyId]?.name ?? "—") : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatExpenseAccount(e)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="line-clamp-1 max-w-[28ch]">{e.notes ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-destructive">
                      {formatCurrency(e.amount, currency)}
                    </td>
                    <td className="px-2 py-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            aria-label="Delete expense"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This soft-deletes the entry and refunds the amount to{" "}
                              {formatExpenseAccount(e)}.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                if (!verifyActionPassword()) return;
                                try {
                                  await remove(e.id);
                                  toast.success("Expense deleted");
                                } catch (err) {
                                  const message =
                                    err instanceof Error ? err.message : "Could not delete expense";
                                  toast.error(message);
                                }
                              }}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ListPaginationBar
              page={pg.page}
              totalPages={pg.totalPages}
              totalCount={pg.totalCount}
              rangeFrom={pg.rangeFrom}
              rangeTo={pg.rangeTo}
              onPageChange={pg.setPage}
            />
          </>
        )}
      </div>

      <QuickAddExpenseDialog open={showQuick} onOpenChange={setShowQuick} />

      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected expenses?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete {selectedCount} selected expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
}) {
  return (
    <div>
      <Label className="sr-only">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-10 w-full justify-between font-normal text-white hover:text-white"
          >
            <span className={cn(!value && "text-white/80")}>
              {value ? format(value, "dd/MM/yyyy") : label}
            </span>
            <CalendarIcon className="ml-2 h-4 w-4 text-white/85" />
          </Button>
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
    </div>
  );
}
