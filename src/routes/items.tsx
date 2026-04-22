import { Outlet, createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useBusinesses } from "@/hooks/useBusinesses";
import { useItems } from "@/hooks/useItems";
import { formatCurrency } from "@/hooks/useParties";
import type { Item, ItemType } from "@/types/item";

const FILTERS = ["all", "product", "service"] as const;
type Filter = (typeof FILTERS)[number];

const searchSchema = z.object({
  q: z.string().catch(""),
  type: z.enum(FILTERS).catch("all"),
});

export const Route = createFileRoute("/items")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Items — Products & Services" },
      {
        name: "description",
        content:
          "Manage your products and services. Track pricing, tax rates, units and availability for invoicing.",
      },
    ],
  }),
  component: ItemsRouteLayout,
});

const TYPE_LABEL: Record<ItemType, string> = {
  product: "Product",
  service: "Service",
};

const TYPE_BADGE: Record<ItemType, string> = {
  product: "bg-primary/10 text-primary",
  service: "bg-accent text-accent-foreground",
};

function ItemsRouteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/items") return <Outlet />;
  return <ItemsPage />;
}

function ItemsPage() {
  const navigate = useNavigate({ from: "/items" });
  const { q, type } = Route.useSearch();
  const { activeId, businesses } = useBusinesses();
  const { items, hydrated, remove } = useItems(activeId);
  const activeBusiness = businesses.find((b) => b.id === activeId);

  const [deleting, setDeleting] = useState<Item | null>(null);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((it) => {
      if (type !== "all" && it.type !== type) return false;
      if (!term) return true;
      return it.name.toLowerCase().includes(term) || (it.sku ?? "").toLowerCase().includes(term);
    });
  }, [items, q, type]);

  const setQuery = (next: string) =>
    navigate({ search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, q: next }) });
  const setType = (next: Filter) =>
    navigate({ search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, type: next }) });

  const confirmDelete = () => {
    if (!deleting) return;
    const name = deleting.name;
    remove(deleting.id);
    setDeleting(null);
    toast.success(`Deleted ${name}`);
  };

  const currency = activeBusiness?.currency ?? "INR";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="max-w-screen-2xl px-6 py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {activeBusiness?.name ?? "Workspace"}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Items</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {hydrated
                  ? `${items.length} ${items.length === 1 ? "item" : "items"} • Products & services`
                  : "Loading…"}
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <Link to="/items/new" search={{} as never}>
                <Plus className="h-4 w-4" />
                Add Item
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or SKU…"
                className="h-11 pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-card p-1">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setType(f)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                    type === f
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f === "all" ? "All" : TYPE_LABEL[f as ItemType] + "s"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl px-6 py-8">
        {hydrated && visible.length === 0 ? (
          <EmptyState filtered={items.length > 0} />
        ) : (
          <ItemsTable items={visible} currency={currency} onDelete={setDeleting} />
        )}
      </main>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This item will be hidden from your catalog and from invoice selection. Past
              transactions referencing it remain unchanged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ItemsTable({
  items,
  currency,
  onDelete,
}: {
  items: Item[];
  currency: string;
  onDelete: (i: Item) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="hidden grid-cols-[2fr_110px_140px_90px_90px_110px_120px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
        <span>Item name</span>
        <span>Type</span>
        <span className="text-right">Selling price</span>
        <span className="text-right">Tax</span>
        <span>Unit</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>

      <ul className="divide-y divide-border">
        {items.map((it) => (
          <li
            key={it.id}
            className="group grid grid-cols-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[2fr_110px_140px_90px_90px_110px_120px]"
          >
            <Link
              to="/items/$id"
              params={{ id: it.id }}
              search={{} as never}
              className="flex min-w-0 items-center gap-3 text-left"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                <Package className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground hover:text-primary">
                  {it.name}
                </p>
                {it.sku && (
                  <p className="truncate font-mono text-xs text-muted-foreground">{it.sku}</p>
                )}
              </div>
            </Link>

            <span
              className={cn(
                "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-xs font-medium",
                TYPE_BADGE[it.type],
              )}
            >
              {TYPE_LABEL[it.type]}
            </span>

            <span className="text-right font-semibold tabular-nums">
              {formatCurrency(it.sellingPrice, currency)}
            </span>

            <span className="text-right font-mono text-sm text-muted-foreground">
              {it.taxPercent}%
            </span>

            <span className="font-mono text-xs uppercase text-muted-foreground">{it.unit}</span>

            <span
              className={cn(
                "inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                it.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  it.active ? "bg-success" : "bg-muted-foreground/60",
                )}
              />
              {it.active ? "Active" : "Inactive"}
            </span>

            <div className="flex justify-start gap-1 sm:justify-end sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
              <Button
                asChild
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                aria-label={`Edit ${it.name}`}
              >
                <Link to="/items/$id/edit" params={{ id: it.id }} search={{} as never}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(it)}
                aria-label={`Delete ${it.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
        <Package className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">
        {filtered ? "No items match your filters" : "No items added yet"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {filtered
          ? "Try a different search term or clear the type filter."
          : "Add your first product or service to start invoicing."}
      </p>
      <Button asChild size="lg" className="mt-6 gap-2">
        <Link to="/items/new" search={{} as never}>
          <Plus className="h-4 w-4" />
          Add Item
        </Link>
      </Button>
    </div>
  );
}
