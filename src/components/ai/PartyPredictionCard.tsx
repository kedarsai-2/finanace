import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles } from "lucide-react";
import type { Party } from "@/types/party";
import type { Invoice } from "@/types/invoice";
import type { Payment } from "@/types/payment";
import { aiPartyPrediction } from "@/lib/ai.functions";
import { buildPartyHistorySnapshot } from "@/lib/aiContext";
import { cn } from "@/lib/utils";

type Pred = {
  predicted_days_to_pay: number;
  risk_level: "low" | "medium" | "high";
  recommended_action: string;
  rationale: string;
};

export function PartyPredictionCard({
  party,
  invoices,
  payments,
}: {
  party: Party;
  invoices: Invoice[];
  payments: Payment[];
}) {
  const callPredict = useServerFn(aiPartyPrediction);
  const [data, setData] = useState<Pred | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const snap = buildPartyHistorySnapshot({ party, invoices, payments });
    if (snap.invoices.length === 0) {
      setLoading(false);
      return;
    }
    callPredict({ data: { partySnapshot: snap } })
      .then((res) => {
        if (cancelled) return;
        if (res.ok) setData(res.data);
        else setError(res.error);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [party.id, invoices, payments, callPredict, party]);

  if (loading) {
    return (
      <div className="glass-card p-4">
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted/60" />
        <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-muted/60" />
      </div>
    );
  }
  if (error || !data) {
    return null;
  }

  const riskCls = {
    low: "bg-success/15 text-success",
    medium: "bg-warning/20 text-warning-foreground",
    high: "bg-destructive/15 text-destructive",
  }[data.risk_level];

  return (
    <div className="glass-card p-4 animate-float-up">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg primary-gradient">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            AI Payment Prediction
          </p>
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", riskCls)}>
          {data.risk_level} risk
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold primary-text">{data.predicted_days_to_pay}</span>
        <span className="text-xs text-muted-foreground">days expected to pay</span>
      </div>
      <p className="mt-2 text-xs text-foreground/80">
        <strong>Action:</strong> {data.recommended_action}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{data.rationale}</p>
    </div>
  );
}
