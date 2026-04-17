import { useCallback, useEffect, useRef, useState } from "react";
import type { Item } from "@/types/item";
import { logAudit, snapshot } from "@/lib/audit";

const STORAGE_KEY = "bm.items";

const seed: Item[] = [
  { id: "i1", businessId: "b1", name: "Steel Bracket 4\"", sku: "SB-004", type: "product", sellingPrice: 240, taxPercent: 18, unit: "PCS", active: true },
  { id: "i2", businessId: "b1", name: "Wood Panel 8x4", sku: "WP-0804", type: "product", sellingPrice: 1850, taxPercent: 12, unit: "PCS", active: true },
  { id: "i3", businessId: "b1", name: "On-site Installation", sku: "SVC-INST", type: "service", sellingPrice: 1500, taxPercent: 18, unit: "HRS", active: true },
  { id: "i4", businessId: "b1", name: "Annual Maintenance Plan", sku: "SVC-AMC", type: "service", sellingPrice: 12000, taxPercent: 18, unit: "YR", active: true },
  { id: "i5", businessId: "b1", name: "Acrylic Sheet 3mm", sku: "AS-003", type: "product", sellingPrice: 680, taxPercent: 18, unit: "SQF", active: false },
  { id: "i6", businessId: "b2", name: "Cotton Fabric Roll", sku: "CF-ROLL", type: "product", sellingPrice: 4200, taxPercent: 5, unit: "ROLL", active: true },
  { id: "i7", businessId: "b2", name: "Custom Tailoring", sku: "SVC-TAIL", type: "service", sellingPrice: 800, taxPercent: 18, unit: "PCS", active: true },
];

function read(): Item[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Item[]) : seed;
  } catch {
    return seed;
  }
}

export function useItems(businessId?: string | null) {
  const [items, setItems] = useState<Item[]>(seed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const itemsRef = useRef<Item[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const upsert = useCallback((it: Item) => {
    const before = itemsRef.current.find((x) => x.id === it.id);
    setItems((prev) => {
      const exists = prev.some((x) => x.id === it.id);
      return exists ? prev.map((x) => (x.id === it.id ? it : x)) : [...prev, it];
    });
    logAudit({
      module: "item",
      action: before ? "edit" : "create",
      recordId: it.id,
      reference: it.name,
      refLink: `/items/${it.id}`,
      businessId: it.businessId,
      before: before ? snapshot(before) : null,
      after: snapshot(it),
    });
  }, []);

  /** Soft delete — keeps the row but hides it from all surfaces. */
  const remove = useCallback((id: string) => {
    const before = itemsRef.current.find((x) => x.id === id);
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, deleted: true, active: false } : x)));
    if (before) {
      logAudit({
        module: "item",
        action: "delete",
        recordId: id,
        reference: before.name,
        businessId: before.businessId,
        before: snapshot(before),
      });
    }
  }, []);

  const toggleActive = useCallback((id: string) => {
    const before = itemsRef.current.find((x) => x.id === id);
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, active: !x.active } : x)));
    if (before) {
      logAudit({
        module: "item",
        action: "edit",
        recordId: id,
        reference: before.name,
        businessId: before.businessId,
        before: { active: before.active },
        after: { active: !before.active },
      });
    }
  }, []);

  // Scope to current business and hide soft-deleted items.
  const scoped = items.filter((x) => !x.deleted && (!businessId || x.businessId === businessId));

  return { items: scoped, allItems: items, hydrated, upsert, remove, toggleActive };
}

/** Items eligible for invoice/purchase selection: scoped, not deleted, and active. */
export function useSelectableItems(businessId?: string | null) {
  const { items, ...rest } = useItems(businessId);
  return { items: items.filter((x) => x.active), ...rest };
}
