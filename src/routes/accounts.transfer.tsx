import { createFileRoute, Link, useNavigate, type SearchSchemaInput } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, ArrowLeftRight, ArrowRight, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

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
import { ProofUpload } from "@/components/proof/ProofUpload";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useAccounts } from "@/hooks/useAccounts";
import { usePayments } from "@/hooks/usePayments";
import { useTransfers } from "@/hooks/useTransfers";
import { useExpenses } from "@/hooks/useExpenses";
import { formatCurrency } from "@/hooks/useParties";
import { accountBalance, buildAccountTxns } from "@/lib/accountLedger";
import { ACCOUNT_TYPE_LABEL } from "@/types/account";

const searchSchema = z.object({
  mode: z.enum(["transfer", "adjustment"]).catch("transfer").default("transfer"),
  scope: z.enum(["all", "bank", "cash"]).catch("all").default("all"),
  preset: z
    .enum(["any", "bank-bank", "cash-bank", "bank-cash", "cash-cash"])
    .catch("any")
    .default("any"),
  accountId: z.string().catch("").default(""),
});

export const Route = createFileRoute("/accounts/transfer")({
  validateSearch: (
    search: Partial<z.infer<typeof searchSchema>> & SearchSchemaInput,
  ): z.infer<typeof searchSchema> => searchSchema.parse(search),
  head: () => ({ meta: [{ title: "Account Transfer — QOBOX" }] }),
  component: TransferPage,
});

function TransferPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { activeId, scopedBusinessId, businesses } = useBusinesses();
  const effectiveBusinessId = scopedBusinessId ?? businesses[0]?.id ?? null;
  const { accounts, hydrated } = useAccounts(effectiveBusinessId, []);
  const safeAccounts = useMemo(() => accounts.filter((a) => !!a.id), [accounts]);
  const { payments } = usePayments(effectiveBusinessId);
  const { transfers, add } = useTransfers(effectiveBusinessId);
  const { expenses } = useExpenses(effectiveBusinessId);

  const business = businesses.find((b) => b.id === effectiveBusinessId) ?? businesses[0];
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

  const [mode, setMode] = useState<"transfer" | "adjustment">(search.mode);
  const [adjustmentDirection, setAdjustmentDirection] = useState<"increment" | "decrement">(
    "increment",
  );
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [proofDataUrl, setProofDataUrl] = useState<string | undefined>();
  const [proofName, setProofName] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const scopedAccounts = useMemo(() => {
    if (search.scope === "bank") return safeAccounts.filter((a) => a.type === "bank");
    if (search.scope === "cash") return safeAccounts.filter((a) => a.type === "cash");
    return safeAccounts;
  }, [safeAccounts, search.scope]);
  const fromOptions = useMemo(() => {
    if (mode !== "transfer") return scopedAccounts;
    if (search.preset === "bank-bank") return safeAccounts.filter((a) => a.type === "bank");
    if (search.preset === "cash-bank") return safeAccounts.filter((a) => a.type === "cash");
    if (search.preset === "bank-cash") return safeAccounts.filter((a) => a.type === "bank");
    if (search.preset === "cash-cash") return safeAccounts.filter((a) => a.type === "cash");
    return scopedAccounts;
  }, [mode, scopedAccounts, safeAccounts, search.preset]);
  const toOptions = useMemo(() => {
    if (mode !== "transfer") return [];
    if (search.preset === "bank-bank")
      return safeAccounts.filter((a) => a.type === "bank" && a.id !== fromId);
    if (search.preset === "cash-bank")
      return safeAccounts.filter((a) => a.type === "bank" && a.id !== fromId);
    if (search.preset === "bank-cash")
      return safeAccounts.filter((a) => a.type === "cash" && a.id !== fromId);
    if (search.preset === "cash-cash")
      return safeAccounts.filter((a) => a.type === "cash" && a.id !== fromId);
    return scopedAccounts.filter((a) => a.id !== fromId);
  }, [mode, scopedAccounts, safeAccounts, search.preset, fromId]);

  const fromBalance = fromId ? (balances[fromId] ?? 0) : 0;
  const fromAccount = fromId ? accountsById[fromId] : undefined;
  const toAccount = toId ? accountsById[toId] : undefined;

  useEffect(() => {
    if (search.scope === "cash" && mode !== "adjustment") {
      setMode("adjustment");
      setToId("");
      navigate({ search: (s) => ({ ...s, mode: "adjustment", preset: "any" }) });
    }
  }, [search.scope, mode, navigate]);

  useEffect(() => {
    if (!search.accountId) return;
    const requested = search.accountId.trim();
    if (!requested) return;
    const requestedAccount = accountsById[requested];
    if (!requestedAccount) return;
    if (search.scope === "cash" && requestedAccount.type !== "cash") return;
    setFromId(requested);
  }, [search.accountId, accountsById, search.scope]);

  const validate = (): string | null => {
    if (!fromId) return "Choose a source account";
    if (mode === "transfer") {
      if (!toId) return "Choose a destination account";
      if (fromId === toId) return "Source and destination must be different";
    }
    if (!(amount > 0)) return "Enter an amount greater than 0";
    if (mode === "transfer" && amount > fromBalance + 0.01)
      return `Insufficient balance (${formatCurrency(fromBalance, currency)})`;
    if (mode === "adjustment" && adjustmentDirection === "decrement" && amount > fromBalance + 0.01)
      return `Insufficient balance (${formatCurrency(fromBalance, currency)})`;
    if (!proofDataUrl) return "Upload proof image";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    if (!effectiveBusinessId) return;
    setSubmitting(true);
    try {
      await add({
        id: "",
        businessId: effectiveBusinessId,
        date: date.toISOString(),
        kind: mode,
        adjustmentDirection: mode === "adjustment" ? adjustmentDirection : undefined,
        fromAccountId: fromId,
        toAccountId: mode === "transfer" ? toId : undefined,
        amount,
        notes: notes.trim() || undefined,
        proofDataUrl,
        proofName,
        createdAt: new Date().toISOString(),
      });
      if (mode === "transfer") {
        toast.success(
          `Transferred ${formatCurrency(amount, currency)} from ${
            accountsById[fromId]?.name
          } to ${accountsById[toId]?.name}`,
        );
      } else {
        toast.success(
          `${adjustmentDirection === "increment" ? "Increased" : "Decreased"} ${
            accountsById[fromId]?.name
          } by ${formatCurrency(amount, currency)}`,
        );
      }
      navigate({ to: search.scope === "cash" ? "/cash" : "/accounts" });
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
        <Link to={search.scope === "cash" ? "/cash" : "/accounts"}>
          <ArrowLeft className="h-4 w-4" /> Back to {search.scope === "cash" ? "cash" : "accounts"}
        </Link>
      </Button>
      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {mode === "transfer" ? "Move money between accounts" : "Adjust account balance"}
        </p>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ArrowLeftRight className="h-6 w-6 text-primary" />{" "}
          {mode === "transfer" ? "Account Transfer" : "Account Adjustment"}
        </h1>
      </header>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Action</Label>
              {search.scope === "cash" ? (
                <div className="flex h-10 items-center rounded-md border border-border bg-muted/20 px-3 text-sm text-muted-foreground">
                  Cash adjustment
                </div>
              ) : (
                <Select
                  value={mode}
                  onValueChange={(v) => {
                    const next = v as "transfer" | "adjustment";
                    setMode(next);
                    if (next === "adjustment") setToId("");
                    navigate({
                      search: (s) => ({
                        ...s,
                        mode: next,
                        preset: next === "adjustment" ? "any" : s.preset,
                      }),
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            {mode === "adjustment" && (
              <div>
                <Label>Adjustment</Label>
                <Select
                  value={adjustmentDirection}
                  onValueChange={(v) => setAdjustmentDirection(v as "increment" | "decrement")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="increment">Increment</SelectItem>
                    <SelectItem value="decrement">Decrement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
            <div>
              <Label htmlFor="from">{mode === "transfer" ? "From account *" : "Account *"}</Label>
              <Select value={fromId} onValueChange={setFromId}>
                <SelectTrigger id="from">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {fromOptions.map((a) => (
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
              {mode === "transfer" ? (
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              ) : (
                <span className="text-xs text-muted-foreground">Adjustment</span>
              )}
            </div>
            {mode === "transfer" ? (
              <div>
                <Label htmlFor="to">To account *</Label>
                <Select value={toId} onValueChange={setToId}>
                  <SelectTrigger id="to">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {toOptions.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} • {ACCOUNT_TYPE_LABEL[a.type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
                {adjustmentDirection === "increment"
                  ? "Amount will be added to this account."
                  : "Amount will be deducted from this account."}
              </div>
            )}
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
            <div className="sm:col-span-2">
              <ProofUpload
                id="transfer-proof"
                label="Proof image"
                required
                proofDataUrl={proofDataUrl}
                proofName={proofName}
                onChange={(p) => {
                  setProofDataUrl(p.proofDataUrl);
                  setProofName(p.proofName);
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/accounts" })}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting} className="gap-2">
            <ArrowLeftRight className="h-4 w-4" />{" "}
            {mode === "transfer" ? "Transfer" : "Apply adjustment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
