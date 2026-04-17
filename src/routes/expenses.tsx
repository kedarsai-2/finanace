import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Receipt, CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { formatCurrency } from "@/hooks/useParties";
import {
  EXPENSE_CATEGORIES,
  type Expense,
  type ExpenseCategory,
} from "@/types/expense";
import { ACCOUNT_TYPE_LABEL } from "@/types/account";

export const Route = createFileRoute("/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — Track outflows" },
      {
        name: "description",
        content:
          "Record business expenses against your accounts to keep balances accurate.",
      },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { activeId, businesses } = useBusinesses();
  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";
  const { accounts } = useAccounts(activeId, []);
  const { expenses, add, remove } = useExpenses(activeId);

  const accountById = useMemo(
    () => Object.fromEntries(accounts.map((a) => [a.id, a])),
    [accounts],
  );

  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [accountId, setAccountId] = useState<string>("");
  const [category, setCategory] = useState<ExpenseCategory>("Other");
  const [amount, setAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setDate(new Date());
    setAccountId(accounts[0]?.id ?? "");
    setCategory("Other");
    setAmount(0);
    setNotes("");
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId) return;
    if (!accountId) return toast.error("Select an account");
    if (!(amount > 0)) return toast.error("Enter an amount greater than 0");
    setSubmitting(true);
    try {
      const exp: Expense = {
        id: `exp_${Date.now()}`,
        businessId: activeId,
        accountId,
        date: date.toISOString(),
        amount,
        category,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      add(exp);
      toast.success(`Expense of ${formatCurrency(amount, currency)} recorded`);
      reset();
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const total = sorted.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Business outflows
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Total {formatCurrency(total, currency)} across {sorted.length} entries
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            reset();
            setShowForm((v) => !v);
          }}
        >
          <Plus className="h-4 w-4" /> {showForm ? "Close" : "Add expense"}
        </Button>
      </header>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="mb-6 grid grid-cols-1 gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-6"
        >
          <div className="sm:col-span-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 w-full justify-between font-normal">
                  {format(date, "dd MMM yyyy")}
                  <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="exp-acc">Account *</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="exp-acc">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} • {ACCOUNT_TYPE_LABEL[a.type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="exp-cat">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ExpenseCategory)}
            >
              <SelectTrigger id="exp-cat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="exp-amt">Amount *</Label>
            <Input
              id="exp-amt"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-right tabular-nums"
            />
          </div>
          <div className="sm:col-span-4">
            <Label htmlFor="exp-notes">Notes</Label>
            <Textarea
              id="exp-notes"
              rows={1}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div className="flex items-end justify-end sm:col-span-6">
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Save expense
            </Button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        {sorted.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Receipt className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">No expenses yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Account</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="w-10 px-2 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                    {format(new Date(e.date), "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3 font-medium">{e.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {accountById[e.accountId]?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{e.notes ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-destructive">
                    {formatCurrency(e.amount, currency)}
                  </td>
                  <td className="px-2 py-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete expense?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the entry and refunds the amount to{" "}
                            {accountById[e.accountId]?.name}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(e.id)}>
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

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Need to add an account?{" "}
        <Link to="/accounts/new" className="text-primary underline">
          Add one here
        </Link>
        .
      </p>
    </div>
  );
}
