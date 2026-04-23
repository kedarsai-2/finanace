import { useMemo, useState } from "react";
import { Loader2, Receipt } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useAccounts } from "@/hooks/useAccounts";
import { useExpenses } from "@/hooks/useExpenses";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { ACCOUNT_TYPE_LABEL, type AccountType } from "@/types/account";
import { type PaymentMode } from "@/types/payment";
import type { Expense } from "@/types/expense";

const LAST_ACCOUNT_KEY = "bm.expenses.lastAccount";

function modeFromAccountType(t: AccountType): PaymentMode {
  return t === "bank" ? "bank" : "cash";
}

interface QuickAddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (e: Expense) => void;
}

export function QuickAddExpenseDialog({
  open,
  onOpenChange,
  onCreated,
}: QuickAddExpenseDialogProps) {
  const { activeId } = useBusinesses();
  const { accounts } = useAccounts(activeId, []);
  const safeAccounts = useMemo(() => accounts.filter((a) => !!a.id), [accounts]);
  const { categories } = useExpenseCategories(activeId);
  const { add } = useExpenses(activeId);

  const lastAccount =
    typeof window !== "undefined"
      ? localStorage.getItem(LAST_ACCOUNT_KEY)
      : null;

  const [amount, setAmount] = useState<number>(0);
  const [accountId, setAccountId] = useState<string>(
    (lastAccount && safeAccounts.find((a) => a.id === lastAccount)?.id) ||
      safeAccounts[0]?.id ||
      "",
  );
  const [category, setCategory] = useState<string>(
    categories[0]?.name ?? "Other",
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!activeId) return toast.error("Select a business first");
    if (!accountId) return toast.error("Account required");
    if (!(amount > 0)) return toast.error("Amount must be > 0");
    setSubmitting(true);
    try {
      const acc = safeAccounts.find((a) => a.id === accountId);
      const exp: Expense = {
        id: "",
        businessId: activeId,
        accountId,
        date: new Date().toISOString(),
        amount,
        category,
        mode: acc ? modeFromAccountType(acc.type) : "cash",
        createdAt: new Date().toISOString(),
      };
      await add(exp);
      if (typeof window !== "undefined") {
        localStorage.setItem(LAST_ACCOUNT_KEY, accountId);
      }
      toast.success("Expense recorded");
      onCreated?.(exp);
      setAmount(0);
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Receipt className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Quick add expense</DialogTitle>
              <DialogDescription>
                Log an expense fast — date is today.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="qae-amt">Amount *</Label>
            <Input
              id="qae-amt"
              type="number"
              min={0}
              step="0.01"
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="text-right tabular-nums"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
            />
          </div>
          <div>
            <Label htmlFor="qae-acc">Account *</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="qae-acc">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                {safeAccounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} • {ACCOUNT_TYPE_LABEL[a.type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="qae-cat">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="qae-cat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={submitting} className="gap-2">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
