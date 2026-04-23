import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useBusinesses } from "@/hooks/useBusinesses";
import { apiFetch } from "@/lib/api";
import { USE_BACKEND } from "@/lib/flags";

export const Route = createFileRoute("/cash/balance")({
  head: () => ({
    meta: [{ title: "Cash Balance — QOBOX" }],
  }),
  component: CashBalancePage,
});

type CashBalanceSnapshot = {
  businessId: number;
  cashAccountId: number;
  openingBalance: number;
  currentBalance: number;
};

function CashBalancePage() {
  const navigate = useNavigate();
  const { scopedBusinessId, isAll } = useBusinesses();

  const [opening, setOpening] = useState<number>(0);
  const [current, setCurrent] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!USE_BACKEND) {
        setHydrated(true);
        setCurrent(null);
        return;
      }
      if (isAll || !scopedBusinessId) {
        setHydrated(true);
        setCurrent(null);
        return;
      }
      const businessNumericId = Number(scopedBusinessId);
      if (!Number.isFinite(businessNumericId)) {
        setHydrated(true);
        setCurrent(null);
        return;
      }
      try {
        const snap = await apiFetch<CashBalanceSnapshot>(
          `/api/cash-balance?businessId=${encodeURIComponent(String(businessNumericId))}`,
        );
        if (cancelled) return;
        setOpening(Number(snap.openingBalance) || 0);
        setCurrent(Number(snap.currentBalance) || 0);
      } catch {
        if (cancelled) return;
        setCurrent(null);
      } finally {
        if (!cancelled) setHydrated(true);
      }
    };
    setHydrated(false);
    run();
    return () => {
      cancelled = true;
    };
  }, [scopedBusinessId, isAll]);

  const onSave = async () => {
    if (isAll || !scopedBusinessId) return toast.error("Select a specific business first");
    if (!USE_BACKEND) return toast.success("Cash balance saved");
    const businessNumericId = Number(scopedBusinessId);
    if (!Number.isFinite(businessNumericId)) {
      return toast.error("Invalid business id for cash balance");
    }
    setSaving(true);
    try {
      const snap = await apiFetch<CashBalanceSnapshot>("/api/cash-balance", {
        method: "PUT",
        body: JSON.stringify({
          businessId: businessNumericId,
          openingBalance: Number(opening) || 0,
        }),
      });
      setCurrent(Number(snap.currentBalance) || 0);
      toast.success("Cash balance updated");
      navigate({ to: "/cash" });
    } catch {
      toast.error("Failed to update cash balance");
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
          Set your starting cash amount. Future cash payments and cash expenses will adjust this
          balance automatically.
        </p>
      </header>

      {!hydrated ? (
        <div className="rounded-xl border border-border bg-card p-6">Loading…</div>
      ) : (
        <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">Current cash balance</div>
            <div className="text-right tabular-nums">
              {current === null ? "—" : current.toFixed(2)}
            </div>
          </div>
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
