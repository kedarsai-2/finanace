import {
  Outlet,
  createFileRoute,
  Link,
  useNavigate,
  useRouterState,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ImageIcon, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { useBusinesses } from "@/hooks/useBusinesses";
import { useItems } from "@/hooks/useItems";
import type { Item } from "@/types/item";
import { formatCurrency } from "@/hooks/useParties";

const AUTO_ASSET_SOURCE_TAG = "[AUTO_ASSET_SOURCE:";
function unitShortLabel(unit?: string) {
  if (unit === "number") return "bhk";
  if (unit === "pcs") return "pcs";
  if (unit === "kg") return "kg";
  if (unit === "litre") return "litre";
  if (unit === "hour") return "hour";
  return unit || "pcs";
}

export const Route = createFileRoute("/assets")({
  head: () => ({
    meta: [
      { title: "Assets - QOBOX" },
      {
        name: "description",
        content: "Manage assets (product-only) used for invoicing and inventory placeholders.",
      },
    ],
  }),
  validateSearch: (
    search: Partial<z.infer<typeof searchSchema>> & SearchSchemaInput,
  ): z.infer<typeof searchSchema> => searchSchema.parse(search),
  component: AssetsRouteLayout,
});

const searchSchema = z.object({
  q: z.string().catch("").default(""),
});

function AssetsRouteLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/assets") return <Outlet />;
  return <AssetsPage />;
}

function AssetsPage() {
  const navigate = useNavigate({ from: "/assets" });
  const { q } = Route.useSearch();
  const { businesses, activeId } = useBusinesses();
  const { items, hydrated, remove } = useItems(activeId);
  const activeBusiness = businesses.find((b) => b.id === activeId);
  const currency = activeBusiness?.currency ?? "INR";

  const [deleting, setDeleting] = useState<Item | null>(null);
  const [importing, setImporting] = useState(false);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((it) => {
      if (it.type !== "product") return false;
      if ((it.description ?? "").includes(AUTO_ASSET_SOURCE_TAG)) return false;
      if (!term) return true;
      return it.name.toLowerCase().includes(term) || (it.sku ?? "").toLowerCase().includes(term);
    });
  }, [items, q]);

  const setQuery = (next: string) =>
    navigate({ search: (prev: z.infer<typeof searchSchema>) => ({ ...prev, q: next }) });

  const confirmDelete = async () => {
    if (!deleting) return;
    const name = deleting.name;
    try {
      await remove(deleting.id);
      setDeleting(null);
      toast.success(`Deleted ${name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete asset";
      toast.error(message);
    }
  };

  const handleBulkImport = async (file?: File | null) => {
    if (!file) return;
    if (!activeId) {
      toast.error("Select an active business first");
      return;
    }
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const workbook = XLSX.read(buf, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      if (!sheet) throw new Error("No sheet found in file");
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      if (rows.length === 0) throw new Error("File has no rows");

      const normalize = (v: unknown) => String(v ?? "").trim();
      const existingNames = new Set(
        items
          .filter((it) => it.type === "product" && !it.deleted)
          .map((it) => it.name.trim().toLowerCase()),
      );

      let created = 0;
      let skipped = 0;
      for (const row of rows) {
        const name = normalize(row.name || row.Name || row.asset || row.Asset);
        const sku = normalize(row.sku || row.SKU);
        const unitRaw = normalize(row.unit || row.Unit || "pcs").toLowerCase();
        const priceRaw = normalize(
          row.price || row.Price || row.sellingPrice || row.SellingPrice || row.selling_price,
        );
        const price = Number(priceRaw);
        if (!name || !Number.isFinite(price) || price < 0) {
          skipped += 1;
          continue;
        }
        const dedupeKey = name.toLowerCase();
        if (existingNames.has(dedupeKey)) {
          skipped += 1;
          continue;
        }
        const allowedUnits = new Set(["number", "pcs", "kg", "litre", "hour"]);
        const unit = allowedUnits.has(unitRaw) ? unitRaw : "pcs";
        await upsert({
          id: "",
          businessId: activeId,
          name,
          type: "product",
          sku: sku || undefined,
          sellingPrice: price,
          purchasePrice: price,
          taxPercent: 18,
          unit,
          openingStock: 1,
          active: true,
        });
        existingNames.add(dedupeKey);
        created += 1;
      }

      if (created === 0) {
        toast.error("No valid rows imported. Required columns: name, price");
      } else {
        toast.success(`Imported ${created} assets${skipped ? ` (${skipped} skipped)` : ""}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bulk import failed";
      toast.error(message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur">
        <div className="max-w-screen-2xl px-6 py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                {activeBusiness?.name ?? "Workspace"}
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">Assets</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {hydrated
                  ? `${visible.length} ${visible.length === 1 ? "asset" : "assets"} • Products only`
                  : "Loading…"}
              </p>
            </div>
            <Button asChild size="lg" className="gap-2">
              <Link to="/assets/new">
                <Plus className="h-4 w-4" />
                Add Asset
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="gap-2"
              disabled={importing}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".csv,.xlsx,.xls";
                input.onchange = () => {
                  const file = input.files?.[0] ?? null;
                  void handleBulkImport(file);
                };
                input.click();
              }}
            >
              <Upload className="h-4 w-4" />
              {importing ? "Importing..." : "Bulk Import"}
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
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl px-6 py-8">
        {hydrated && visible.length === 0 ? (
          <EmptyState filtered={items.some((i) => i.type === "product")} />
        ) : (
          <AssetsTable items={visible} currency={currency} onDelete={setDeleting} />
        )}
      </main>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleting?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This asset will be hidden from your catalog and from invoice selection. Past
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

function AssetsTable({
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
      <div className="hidden grid-cols-[minmax(0,3fr)_160px_160px_110px_100px] items-center gap-4 border-b border-border bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
        <span>Asset</span>
        <span className="text-right">Unit (Qty)</span>
        <span className="text-right">Unit price</span>
        <span className="text-center">Status</span>
        <span className="text-right">Actions</span>
      </div>

      <ul className="divide-y divide-border">
        {items.map((it) => (
          <li
            key={it.id}
            className="group grid grid-cols-1 items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/30 sm:grid-cols-[minmax(0,3fr)_160px_160px_110px_100px]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary-glow text-primary-foreground">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{it.name}</p>
                {it.sku && (
                  <p className="truncate font-mono text-xs text-muted-foreground">{it.sku}</p>
                )}
              </div>
            </div>

            <span className="text-right font-mono text-sm text-muted-foreground">
              <span className="tabular-nums">{it.openingStock ?? 1}</span>
              <span className="text-xs"> ({unitShortLabel(it.unit)})</span>
            </span>

            <span className="text-right font-semibold tabular-nums">
              {formatCurrency(it.sellingPrice, currency)}
            </span>

            <div className="flex sm:justify-center">
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
            </div>

            <div className="flex justify-start gap-1 sm:justify-end sm:opacity-100 sm:transition-opacity">
              <Button
                asChild
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                aria-label={`Edit ${it.name}`}
                title="Edit"
              >
                <Link to="/assets/$id/edit" params={{ id: it.id }}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => onDelete(it)}
                aria-label={`Delete ${it.name}`}
                title="Delete"
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
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-primary to-primary-glow text-primary-foreground">
        <ImageIcon className="h-8 w-8" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">
        {filtered ? "No assets match your search" : "No assets yet"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {filtered
          ? "Try a different search term."
          : "Add your first asset (product) to start using it in invoices."}
      </p>
      <Button asChild size="lg" className="mt-6 gap-2">
        <Link to="/assets/new">
          <Plus className="h-4 w-4" />
          Add Asset
        </Link>
      </Button>
    </div>
  );
}
