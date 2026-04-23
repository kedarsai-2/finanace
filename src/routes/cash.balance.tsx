import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useAccounts } from "@/hooks/useAccounts";

export const Route = createFileRoute("/cash/balance")({
  head: () => ({
    meta: [{ title: "Cash Balance — QOBOX" }],
  }),
  component: CashBalancePage,
});

function CashBalancePage() {
  const navigate = useNavigate();
  const { activeId } = useBusinesses();
  const { accounts, hydrated, upsert } = useAccounts(activeId, activeId ? [activeId] : []);

  const cash = useMemo(
    () => accounts.find((a) => a.type === "cash"),
    [accounts],
  );

  const [opening, setOpening] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    setOpening(cash?.openingBalance ?? 0);
  }, [hydrated, cash?.openingBalance]);

  const onSave = async () => {
    if (!activeId) return toast.error("Select a business first");
    setSaving(true);
    try {
      await upsert({
        id: cash?.id ?? "",
        businessId: activeId,
        name: cash?.name ?? "Cash",
        type: "cash",
        openingBalance: Number(opening) || 0,
        createdAt: cash?.createdAt ?? new Date().toISOString(),
      });
      toast.success("Cash balance updated");
      navigate({ to: "/cash" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="mb-3 gap-2">
        <Link to="/cash">
          <ArrowLeft className="h-4 w-4" /> Back to cash
        </Link>
      </Button>

      <header className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Cash on hand
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Cash balance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Set your starting cash amount. Future cash payments and cash expenses will adjust this balance automatically.
        </p>
      </header>

      {!hydrated ? (
        <div className="rounded-xl border border-border bg-card p-6">Loading…</div>
      ) : (
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div>
            <Label htmlFor="cash-opening">Starting cash balance</Label>
            <Input
              id="cash-opening"
              type="number"
              step="0.01"
              value={opening}
              onChange={(e) => setOpening(Number(e.target.value))}
              className="text-right tabular-nums"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={onSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

