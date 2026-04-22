import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Package, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useItems } from "@/hooks/useItems";
import { formatCurrency } from "@/hooks/useParties";

export const Route = createFileRoute("/items/$id/")({
  head: () => ({
    meta: [
      { title: "Item Details" },
      { name: "description", content: "View product or service details, pricing and tax." },
    ],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">Item not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">This item may have been deleted.</p>
      <Button asChild className="mt-6">
        <Link to="/items" search={{ q: "", type: "all" }}>
          Back to Items
        </Link>
      </Button>
    </div>
  ),
  component: ItemDetailsPage,
});

function ItemDetailsPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { businesses, activeId } = useBusinesses();
  const { allItems, hydrated, toggleActive } = useItems();
  const activeBusiness = businesses.find((b) => b.id === activeId);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-muted-foreground">Loading…</div>
    );
  }

  const item = allItems.find((x) => x.id === id && !x.deleted);
  if (!item) throw notFound();

  const currency = activeBusiness?.currency ?? "INR";
  const isService = item.type === "service";

  const onToggle = () => {
    toggleActive(item.id);
    toast.success(item.active ? `${item.name} deactivated` : `${item.name} reactivated`);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background pb-16">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4 gap-1.5">
            <Link to="/items" search={{ q: "", type: "all" }}>
              <ArrowLeft className="h-4 w-4" />
              All items
            </Link>
          </Button>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                <Package className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
                    {item.name}
                  </h1>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      item.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        item.active ? "bg-success" : "bg-muted-foreground/60",
                      )}
                    />
                    {item.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="capitalize">{item.type}</span>
                  {item.sku && (
                    <>
                      <span aria-hidden>•</span>
                      <span className="font-mono text-xs">{item.sku}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={onToggle}
                className={cn("gap-2", item.active && "text-destructive hover:text-destructive")}
              >
                {item.active ? (
                  <>
                    <PowerOff className="h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="h-4 w-4" />
                    Reactivate
                  </>
                )}
              </Button>
              <Button
                onClick={() =>
                  navigate({ to: "/items/$id/edit", params: { id: item.id }, search: {} as never })
                }
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>

          {!item.active && (
            <p className="mt-4 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              This item is inactive. It cannot be added to new invoices, but past transactions
              referencing it remain unchanged.
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight">Overview</h2>
          <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
            <Field label="Item name" value={item.name} />
            <Field label="Type" value={<span className="capitalize">{item.type}</span>} />
            <Field
              label="Selling price"
              value={
                <span className="text-base font-bold tabular-nums">
                  {formatCurrency(item.sellingPrice, currency)}
                </span>
              }
            />
            <Field label="Tax rate" value={<span className="font-mono">{item.taxPercent}%</span>} />
            <Field label="Unit" value={<span className="font-mono uppercase">{item.unit}</span>} />
            {item.purchasePrice !== undefined && (
              <Field
                label="Purchase price"
                value={
                  <span className="tabular-nums">
                    {formatCurrency(item.purchasePrice, currency)}
                  </span>
                }
              />
            )}
            {item.sku && (
              <Field label="SKU" value={<span className="font-mono">{item.sku}</span>} />
            )}
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold tracking-tight">Description</h2>
          {item.description ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {item.description}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No description added.</p>
          )}
        </section>

        {!isService && (item.openingStock !== undefined || item.reorderLevel !== undefined) && (
          <section className="rounded-2xl border border-dashed border-border bg-card/40 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight">Inventory</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Coming soon
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              {item.openingStock !== undefined && (
                <Field label="Opening stock" value={`${item.openingStock} ${item.unit}`} />
              )}
              {item.reorderLevel !== undefined && (
                <Field label="Reorder level" value={`${item.reorderLevel} ${item.unit}`} />
              )}
            </dl>
          </section>
        )}
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{value}</dd>
    </div>
  );
}
