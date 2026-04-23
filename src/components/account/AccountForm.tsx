import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Wallet, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/hooks/useAccounts";
import { useBusinesses } from "@/hooks/useBusinesses";
import {
  ACCOUNT_TYPE_LABEL,
  type Account,
  type AccountType,
} from "@/types/account";

interface Props {
  account?: Account;
  mode: "create" | "edit";
}

export function AccountForm({ account, mode }: Props) {
  const navigate = useNavigate();
  const { activeId } = useBusinesses();
  const { upsert } = useAccounts(activeId, []);

  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "bank");
  const [openingBalance, setOpeningBalance] = useState<number>(
    account?.openingBalance ?? 0,
  );
  const [accountNumber, setAccountNumber] = useState(account?.accountNumber ?? "");
  const [ifsc, setIfsc] = useState(account?.ifsc ?? "");
  const [upiId, setUpiId] = useState(account?.upiId ?? "");
  const [notes, setNotes] = useState(account?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Account name is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!activeId) {
      toast.error("Select a business first");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Account = {
        id: account?.id ?? "",
        businessId: account?.businessId ?? activeId,
        name: name.trim(),
        type,
        openingBalance: Number(openingBalance) || 0,
        accountNumber: accountNumber.trim() || undefined,
        ifsc: ifsc.trim() || undefined,
        upiId: upiId.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: account?.createdAt ?? new Date().toISOString(),
      };
      await upsert(payload);
      toast.success(mode === "create" ? "Account added" : "Account updated");
      navigate({ to: "/accounts" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Account details
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Account name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. HDFC Current ****1234"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="type">Type *</Label>
            <Select value={type} onValueChange={(v) => setType(v as AccountType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ACCOUNT_TYPE_LABEL) as AccountType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {ACCOUNT_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="ob">Opening balance</Label>
            <Input
              id="ob"
              type="number"
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(Number(e.target.value))}
              className="text-right tabular-nums"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Starting balance recorded as the first transaction.
            </p>
          </div>

          {type === "bank" && (
            <>
              <div>
                <Label htmlFor="acno">Account number</Label>
                <Input
                  id="acno"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label htmlFor="ifsc">IFSC</Label>
                <Input
                  id="ifsc"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </>
          )}

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
          <X className="mr-2 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={submitting} className="gap-2">
          <Save className="h-4 w-4" /> Save account
        </Button>
      </div>
    </form>
  );
}
