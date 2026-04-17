import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  Download,
  FileSpreadsheet,
  FileText,
  Receipt,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/hooks/useParties";
import type { LedgerEntry, LedgerTxnType, Party } from "@/types/party";

const TYPE_FILTERS: { value: "all" | LedgerTxnType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "invoice", label: "Invoice" },
  { value: "payment", label: "Payment" },
  { value: "purchase", label: "Purchase" },
  { value: "expense", label: "Expense" },
];

const TYPE_BADGE: Record<LedgerTxnType, string> = {
  opening: "bg-muted text-muted-foreground",
  invoice: "bg-primary/10 text-primary",
  payment: "bg-success/15 text-success",
  purchase: "bg-warning/15 text-warning-foreground/80",
  expense: "bg-destructive/10 text-destructive",
};

const TYPE_LABEL: Record<LedgerTxnType, string> = {
  opening: "Opening",
  invoice: "Invoice",
  payment: "Payment",
  purchase: "Purchase",
  expense: "Expense",
};

interface Row extends LedgerEntry {
  running: number;
}

export function PartyLedger({
  party,
  entries,
  currency,
}: {
  party: Party;
  entries: LedgerEntry[];
  currency: string;
}) {
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [type, setType] = useState<"all" | LedgerTxnType>("all");

  // Compute running balance chronologically over ALL entries (not filtered)
  // so the running figure stays meaningful when filters are applied.
  const allChronological = useMemo(
    () =>
      [...entries].sort((a, b) => (a.date < b.date ? -1 : 1)),
    [entries],
  );

  const withRunning = useMemo<Row[]>(() => {
    let running = 0;
    return allChronological.map((e) => {
      running += e.amount;
      return { ...e, running };
    });
  }, [allChronological]);

  const filtered = useMemo(() => {
    return withRunning.filter((e) => {
      const d = new Date(e.date);
      if (from && d < startOfDay(from)) return false;
      if (to && d > endOfDay(to)) return false;
      if (type !== "all") {
        const t = e.type ?? "opening";
        if (t !== type) return false;
      }
      return true;
    });
  }, [withRunning, from, to, type]);

  // Display newest first
  const display = useMemo(() => [...filtered].reverse(), [filtered]);

  const clearFilters = () => {
    setFrom(undefined);
    setTo(undefined);
    setType("all");
  };

  const hasFilters = from || to || type !== "all";

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`${party.name} — Ledger`, 14, 16);
    doc.setFontSize(10);
    doc.setTextColor(120);
    const range =
      from || to
        ? `${from ? format(from, "dd MMM yyyy") : "—"} to ${to ? format(to, "dd MMM yyyy") : "—"}`
        : "All transactions";
    doc.text(range, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Date", "Type", "Ref No", "Particulars", "Debit", "Credit", "Balance"]],
      body: display.map((e) => [
        format(new Date(e.date), "dd MMM yyyy"),
        TYPE_LABEL[e.type ?? "opening"],
        e.refNo ?? "—",
        e.note,
        e.amount > 0 ? formatCurrency(e.amount, currency) : "—",
        e.amount < 0 ? formatCurrency(e.amount, currency) : "—",
        formatCurrency(e.running, currency),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 30, 30] },
    });
    doc.save(`${party.name.replace(/\s+/g, "_")}_ledger.pdf`);
  };

  const exportExcel = () => {
    const data = display.map((e) => ({
      Date: format(new Date(e.date), "yyyy-MM-dd"),
      Type: TYPE_LABEL[e.type ?? "opening"],
      "Ref No": e.refNo ?? "",
      Particulars: e.note,
      Debit: e.amount > 0 ? e.amount : "",
      Credit: e.amount < 0 ? Math.abs(e.amount) : "",
      Balance: e.running,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Ledger");
    XLSX.writeFile(wb, `${party.name.replace(/\s+/g, "_")}_ledger.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <DateButton label="From" date={from} onChange={setFrom} />
        <DateButton label="To" date={to} onChange={setTo} />

        <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-background p-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setType(f.value)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                type === f.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-muted-foreground"
            onClick={clearFilters}
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}

        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportPDF} disabled={display.length === 0}>
                <FileText className="mr-2 h-4 w-4" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportExcel} disabled={display.length === 0}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      {display.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="hidden grid-cols-[110px_110px_120px_1fr_120px_120px_140px] items-center gap-3 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:grid">
            <span>Date</span>
            <span>Type</span>
            <span>Ref No</span>
            <span>Particulars</span>
            <span className="text-right">Debit</span>
            <span className="text-right">Credit</span>
            <span className="text-right">Balance</span>
          </div>
          <ul className="divide-y divide-border">
            {display.map((e) => {
              const t = e.type ?? "opening";
              const isDebit = e.amount > 0;
              return (
                <li
                  key={e.id}
                  className="grid grid-cols-2 gap-2 px-5 py-3 text-sm md:grid-cols-[110px_110px_120px_1fr_120px_120px_140px] md:items-center md:gap-3"
                >
                  <span className="text-muted-foreground">
                    {format(new Date(e.date), "dd MMM yyyy")}
                  </span>
                  <span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                        TYPE_BADGE[t],
                      )}
                    >
                      {TYPE_LABEL[t]}
                    </span>
                  </span>
                  <span className="font-mono text-xs">
                    {e.refLink ? (
                      <a
                        href={e.refLink}
                        className="text-primary hover:underline"
                      >
                        {e.refNo ?? "—"}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">
                        {e.refNo ?? "—"}
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-foreground">{e.note}</span>
                  <span className="text-right font-mono tabular-nums">
                    {isDebit ? formatCurrency(e.amount, currency) : "—"}
                  </span>
                  <span className="text-right font-mono tabular-nums">
                    {!isDebit && e.amount !== 0
                      ? formatCurrency(e.amount, currency)
                      : "—"}
                  </span>
                  <span
                    className={cn(
                      "text-right font-mono font-semibold tabular-nums",
                      e.running > 0 && "text-success",
                      e.running < 0 && "text-destructive",
                      e.running === 0 && "text-muted-foreground",
                    )}
                  >
                    {formatCurrency(e.running, currency)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function DateButton({
  label,
  date,
  onChange,
}: {
  label: string;
  date?: Date;
  onChange: (d: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 font-normal",
            !date && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {date ? format(date, "dd MMM yyyy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onChange}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Receipt className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold">No transactions found</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Try adjusting the date range or transaction type filters.
      </p>
    </div>
  );
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
