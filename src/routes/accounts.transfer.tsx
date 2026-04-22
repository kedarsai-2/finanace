import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, ArrowLeftRight, ArrowRight, CalendarIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useAccounts } from "@/hooks/useAccounts";
import { usePayments } from "@/hooks/usePayments";
import { useTransfers } from "@/hooks/useTransfers";
import { useExpenses } from "@/hooks/useExpenses";
import { formatCurrency } from "@/hooks/useParties";
import { accountBalance, buildAccountTxns } from "@/lib/accountLedger";
import { ACCOUNT_TYPE_LABEL } from "@/types/account";

export const Route = createFileRoute("/accounts/transfer")({
  head: () => ({ meta: [{ title: "Account Transfer — QOBOX" }] }),
  component: TransferPage,
});

function TransferPage() {
  const navigate = useNavigate();
  const { activeId, businesses } = useBusinesses();
  const { accounts, hydrated } = useAccounts(activeId, []);
  const safeAccounts = useMemo(() => accounts.filter((a) => !!a.id), [accounts]);
  const { payments } = usePayments(activeId);
  const { transfers, add } = useTransfers(activeId);
  const { expenses } = useExpenses(activeId);

  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";

  const accountsById = useMemo(
    () => Object.fromEntries(safeAccounts.map((a) => [a.id, a])),
    [safeAccounts],
  );

  const balances = useMemo(() => {
    return Object.fromEntries(
      safeAccounts.map((a) => [
        a.id,
        accountBalance(
          buildAccountTxns({ account: a, payments, transfers, expenses, accountsById }),
        ),
      ]),
    );
  }, [safeAccounts, payments, transfers, expenses, accountsById]);

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fromBalance = fromId ? (balances[fromId] ?? 0) : 0;

  const validate = (): string | null => {
    if (!fromId) return "Choose a source account";
    if (!toId) return "Choose a destination account";
    if (fromId === toId) return "Source and destination must be different";
    if (!(amount > 0)) return "Enter an amount greater than 0";
    if (amount > fromBalance + 0.01)
      return `Insufficient balance (${formatCurrency(fromBalance, currency)})`;
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (!activeId) return;
    setSubmitting(true);
    try {
      await add({
        id: "",
        businessId: activeId,
        date: date.toISOString(),
        fromAccountId: fromId,
        toAccountId: toId,
        amount,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString(),
      });
      toast.success(
        `Transferred ${formatCurrency(amount, currency)} from ${
          accountsById[fromId]?.name
        } to ${accountsById[toId]?.name}`,
      );
      navigate({ to: "/accounts" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated) {
    return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 gap-2">
        <Link to="/accounts">
          <ArrowLeft className="h-4 w-4" /> Back to accounts
        </Link>
      </Button>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Move money between accounts
        </p>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ArrowLeftRight className="h-6 w-6 text-primary" /> Account Transfer
        </h1>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <div>
              <Label htmlFor="from">From account *</Label>
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger id="from">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {safeAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name} • {ACCOUNT_TYPE_LABEL[a.type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fromId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Available {formatCurrency(fromBalance, currency)}
                </p>
              )}
            </div>
            <div className="hidden sm:flex sm:h-10 sm:items-center sm:justify-center">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <Label htmlFor="to">To account *</Label>
              <Select value={toId} onValueChange={setToId}>
                <SelectTrigger id="to">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {safeAccounts
                    .filter((a) => a.id !== fromId)
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} • {ACCOUNT_TYPE_LABEL[a.type]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="text-right tabular-nums"
              />
            </div>
            <div>
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
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/accounts" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="gap-2">
            <ArrowLeftRight className="h-4 w-4" /> Transfer
          </Button>
        </div>
      </form>
    </div>
  );
}
