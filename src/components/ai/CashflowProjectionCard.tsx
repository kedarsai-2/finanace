import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { TrendingUp, RefreshCw, Info } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { aiCashflow } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Projection = {
  projection: Array<{
    week: string;
    expected_inflow: number;
    expected_outflow: number;
    net: number;
  }>;
  confidence: "low" | "medium" | "high";
  assumptions: string[];
};

export function CashflowProjectionCard({
  snapshot,
  currency,
}: {
  snapshot: unknown;
  currency: string;
}) {
  const callCashflow = useServerFn(aiCashflow);
  const [data, setData] = useState<Projection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await callCashflow({ data: { snapshot } });
      if (res.ok) setData(res.data);
      else setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="glass-card p-5 animate-float-up">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl primary-gradient primary-glow">
            <TrendingUp className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              AI Forecast
            </p>
            <h3 className="text-sm font-bold">12-week cashflow projection</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                data.confidence === "high" && "bg-success/15 text-success",
                data.confidence === "medium" && "bg-warning/20 text-warning-foreground",
                data.confidence === "low" && "bg-muted text-muted-foreground",
              )}
            >
              {data.confidence} confidence
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="gap-1.5">
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {loading && !data && <div className="h-56 animate-pulse rounded-xl bg-muted/40" />}
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{error}</p>
      )}

      {data && (
        <>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.projection} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="inflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--destructive)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--destructive)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="week"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => compact(v)}
                />
                <RTooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => format(v, currency)}
                />
                <Area
                  type="monotone"
                  dataKey="expected_inflow"
                  stroke="var(--primary)"
                  fill="url(#inflow)"
                  strokeWidth={2}
                  name="Inflow"
                />
                <Area
                  type="monotone"
                  dataKey="expected_outflow"
                  stroke="var(--destructive)"
                  fill="url(#outflow)"
                  strokeWidth={2}
                  name="Outflow"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {data.assumptions.length > 0 && (
            <div className="mt-3 rounded-lg bg-muted/40 p-3">
              <div className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="eyebrow">Assumptions</p>
              </div>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-[11px] text-muted-foreground">
                {data.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function format(v: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(v);
}
function compact(v: number) {
  if (Math.abs(v) >= 1e7) return (v / 1e7).toFixed(1) + "Cr";
  if (Math.abs(v) >= 1e5) return (v / 1e5).toFixed(1) + "L";
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(0) + "k";
  return String(v);
}
