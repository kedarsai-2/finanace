import { useEffect, useState } from "react";
import { Sparkles, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { aiInsights } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Insights = {
  narrative: string;
  top_actions: Array<{ title: string; why: string; urgency: "low" | "medium" | "high" }>;
  risks: Array<{ label: string; detail: string; severity: "low" | "medium" | "high" }>;
};

export function AIInsightsCard({ snapshot }: { snapshot: unknown }) {
  const callInsights = useServerFn(aiInsights);
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await callInsights({ data: { snapshot } });
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
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              AI Briefing
            </p>
            <h3 className="text-sm font-bold">Today’s insights</h3>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="gap-1.5">
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {loading && !data && (
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted/60" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted/60" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-muted/60" />
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{error}</p>
      )}

      {data && (
        <>
          <p className="text-sm leading-relaxed text-foreground/90">{data.narrative}</p>

          {data.top_actions.length > 0 && (
            <div className="mt-4">
              <p className="eyebrow mb-2">Recommended actions</p>
              <ul className="space-y-1.5">
                {data.top_actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg bg-card/40 p-2.5">
                    <CheckCircle2
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        a.urgency === "high" && "text-destructive",
                        a.urgency === "medium" && "text-warning",
                        a.urgency === "low" && "text-success",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground">{a.why}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.risks.length > 0 && (
            <div className="mt-4">
              <p className="eyebrow mb-2">Risks</p>
              <ul className="space-y-1.5">
                {data.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg bg-destructive/5 p-2.5">
                    <AlertTriangle
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        r.severity === "high" && "text-destructive",
                        r.severity === "medium" && "text-warning",
                        r.severity === "low" && "text-muted-foreground",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">{r.label}</p>
                      <p className="text-[11px] text-muted-foreground">{r.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
