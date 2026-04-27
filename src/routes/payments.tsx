import {
  Outlet,
  createFileRoute,
  Link,
  useRouterState,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { useMemo } from "react";
import { format } from "date-fns";
import { Plus, Wallet, ArrowDownCircle, ArrowUpCircle, Paperclip } from "lucide-react";
import { z } from "zod";

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
import { cn } from "@/lib/utils";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useAccounts } from "@/hooks/useAccounts";
import { usePayments } from "@/hooks/usePayments";
import { useParties, formatCurrency } from "@/hooks/useParties";
import { PAYMENT_MODE_LABEL, type PaymentDirection } from "@/types/payment";
import { hasAnyProof, parseProofAttachments, primaryProofUrl } from "@/lib/proofAttachments";

const DIRS = ["all", "in", "out"] as const;
type DirFilter = (typeof DIRS)[number];

const searchSchema = z.object({
  dir: z.enum(DIRS).catch("all").default("all"),
  from: z.string().catch("").default(""),
  to: z.string().catch("").default(""),
  account: z.string().catch("").default(""),
});

export const Route = createFileRoute("/payments")({
  validateSearch: (
    search: Partial<z.infer<typeof searchSchema>> & SearchSchemaInput,
  ): z.infer<typeof searchSchema> => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Payments — Receive & Pay" },
      {
        name: "description",
        content:
          "Track every payment received from customers and made to suppliers across all accounts.",
      },
    ],
  }),
  component: PaymentsRouteLayout,
});

function PaymentsRouteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/payments") return <Outlet />;
  return <PaymentsPage />;
}

function PaymentsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { activeId, businesses } = useBusinesses();
  const { payments } = usePayments(activeId);
  const { accounts } = useAccounts(activeId, []);
  const { parties } = useParties(activeId);
  const safeAccounts = useMemo(() => accounts.filter((a) => !!a.id), [accounts]);

  const business = businesses.find((b) => b.id === activeId);
  const currency = business?.currency ?? "INR";
  const partyById = useMemo(() => Object.fromEntries(parties.map((p) => [p.id, p])), [parties]);
  const accountById = useMemo(
    () => Object.fromEntries(safeAccounts.map((a) => [a.id, a])),
    [safeAccounts],
  );

  const filtered = useMemo(() => {
    return payments
      .filter((p) => {
        if (search.dir !== "all" && p.direction !== search.dir) return false;
        if (search.account && p.accountId !== search.account) return false;
        if (search.from && new Date(p.date) < new Date(search.from)) return false;
        if (search.to && new Date(p.date) > new Date(`${search.to}T23:59:59`)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, search.dir, search.account, search.from, search.to]);

  return (
    <div className="max-w-screen-2xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            All money movement
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        </div>
        <Button asChild className="gap-2">
          <Link to="/payments/new">
            <Plus className="h-4 w-4" /> Record payment
          </Link>
        </Button>
      </header>

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div>
          <Label>Type</Label>
          <Select
            value={search.dir}
            onValueChange={(v) =>
              navigate({
                search: (s: z.infer<typeof searchSchema>) => ({ ...s, dir: v as DirFilter }),
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="in">Receive</SelectItem>
              <SelectItem value="out">Pay</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Account</Label>
          <Select
            value={search.account || "_all"}
            onValueChange={(v) =>
              navigate({
                search: (s: z.infer<typeof searchSchema>) => ({
                  ...s,
                  account: v === "_all" ? "" : v,
                }),
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All accounts</SelectItem>
              {safeAccounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>From</Label>
          <Input
            type="date"
            value={search.from}
            onChange={(e) =>
              navigate({
                search: (s: z.infer<typeof searchSchema>) => ({ ...s, from: e.target.value }),
              })
            }
          />
        </div>
        <div>
          <Label>To</Label>
          <Input
            type="date"
            value={search.to}
            onChange={(e) =>
              navigate({
                search: (s: z.infer<typeof searchSchema>) => ({ ...s, to: e.target.value }),
              })
            }
          />
        </div>
      </section>

      <div className="overflow-hidden rounded-xl border border-border">
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Wallet className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium">No payments yet</p>
            <Button asChild size="sm" className="mt-3 gap-2">
              <Link to="/payments/new">
                <Plus className="h-4 w-4" /> Record payment
              </Link>
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Party</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-left">Account</th>
                <th className="px-4 py-3 text-left">Reference</th>
                <th className="w-10 px-2 py-3 text-center">Proof</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const party = partyById[p.partyId];
                const acc = p.accountId ? accountById[p.accountId] : undefined;
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {format(new Date(p.date), "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3 font-medium">{party?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <DirBadge direction={p.direction} />
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right font-semibold tabular-nums",
                        p.direction === "in"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-destructive",
                      )}
                    >
                      {p.direction === "in" ? "+" : "-"}
                      {formatCurrency(p.amount, currency)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {acc?.name ?? p.account ?? "—"}{" "}
                      <span className="text-xs">({PAYMENT_MODE_LABEL[p.mode]})</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {p.reference || p.allocations.map((a) => a.docNumber).join(", ") || "—"}
                    </td>
                    <td className="px-2 py-3 text-center">
                      {hasAnyProof(p.proofDataUrl, p.proofName) ? (
                        <a
                          href={primaryProofUrl(p.proofDataUrl, p.proofName)}
                          target="_blank"
                          rel="noreferrer"
                          download={
                            parseProofAttachments(p.proofDataUrl, p.proofName).imageName ||
                            parseProofAttachments(p.proofDataUrl, p.proofName).documentName ||
                            "proof"
                          }
                          title="View attachment"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <Paperclip className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function DirBadge({ direction }: { direction: PaymentDirection }) {
  const isIn = direction === "in";
  const Icon = isIn ? ArrowDownCircle : ArrowUpCircle;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isIn
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive",
      )}
    >
      <Icon className="h-3 w-3" />
      {isIn ? "Receive" : "Pay"}
    </span>
  );
}
