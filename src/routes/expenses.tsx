import { Outlet, createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, Receipt, Search, Tags, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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

import { useBusinesses } from "@/hooks/useBusinesses";
import { useAccounts } from "@/hooks/useAccounts";
import { useExpenses } from "@/hooks/useExpenses";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { QuickAddExpenseDialog } from "@/components/expense/QuickAddExpenseDialog";
import { DEFAULT_EXPENSE_TYPES } from "@/types/expense";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — Track outflows" },
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
  const safeAccounts = useMemo(() => accounts.filter((a) => !!a.id), [accounts]);
  const { parties } = useParties(activeId);
  const { categories } = useExpenseCategories(activeId);
  const { expenses, remove } = useExpenses(activeId);

  const accountById = useMemo(
    () => Object.fromEntries(safeAccounts.map((a) => [a.id, a])),
    [safeAccounts],
  );
  const partyById = useMemo(() => Object.fromEntries(parties.map((p) => [p.id, p])), [parties]);

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [from, setFrom] = useState<Date | undefined>();
  const [to, setTo] = useState<Date | undefined>();
  const [showQuick, setShowQuick] = useState(false);

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

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const clearFilters = () => {
    setQ("");
    setTypeFilter("all");
    setCategoryFilter("all");
    setAccountFilter("all");
    setFrom(undefined);
    setTo(undefined);
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

      <div className="overflow-hidden rounded-xl border border-border">
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
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
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
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    <Link
                      to="/expenses/$id"
                      params={{ id: e.id }}
                      className="hover:text-foreground"
                    >
                      {format(new Date(e.date), "dd MMM yyyy")}
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
                  <td className="px-4 py-3 text-muted-foreground">
                    {accountById[e.accountId]?.name ?? "—"}
                  </td>
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
                            {accountById[e.accountId]?.name ?? "the account"}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
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
        )}
      </div>

      <QuickAddExpenseDialog open={showQuick} onOpenChange={setShowQuick} />
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
          <Button variant="outline" className="h-10 w-full justify-between font-normal">
            <span className={cn(!value && "text-muted-foreground")}>
              {value ? format(value, "dd MMM") : label}
            </span>
            <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
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
