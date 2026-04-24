import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "@/types/item";
import { logAudit, snapshot } from "@/lib/audit";
import { USE_BACKEND } from "@/lib/flags";
import { apiFetch } from "@/lib/api";
import { getJwt } from "@/lib/auth";
import { businessRefFromId, toNumId, toStrId } from "@/lib/dto";

const STORAGE_KEY = "bm.items";

type ItemDTO = {
  id?: number;
  name: string;
  sku?: string | null;
  type: "PRODUCT" | "SERVICE";
  sellingPrice: number;
  purchasePrice?: number | null;
  taxPercent: number;
  unit: string;
  active: boolean;
  deleted?: boolean | null;
  description?: string | null;
  openingStock?: number | null;
  reorderLevel?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  business?: { id: number; name?: string | null } | null;
};

function dtoToItem(dto: ItemDTO): Item {
  const bizId = dto.business?.id;
  return {
    id: toStrId(dto.id),
    businessId: bizId != null ? String(bizId) : "",
    name: dto.name,
    sku: dto.sku ?? undefined,
    type: dto.type === "PRODUCT" ? "product" : "service",
    sellingPrice: Number(dto.sellingPrice ?? 0),
    purchasePrice: dto.purchasePrice ?? undefined,
    taxPercent: Number(dto.taxPercent ?? 0),
    unit: dto.unit,
    active: !!dto.active,
    deleted: dto.deleted ?? undefined,
    description: dto.description ?? undefined,
    openingStock: dto.openingStock ?? undefined,
    reorderLevel: dto.reorderLevel ?? undefined,
  };
}

function itemToDto(it: Item): ItemDTO {
  return {
    id: toNumId(it.id) ?? undefined,
    name: it.name,
    sku: it.sku ?? null,
    type: it.type === "product" ? "PRODUCT" : "SERVICE",
    sellingPrice: it.sellingPrice ?? 0,
    purchasePrice: it.purchasePrice ?? null,
    taxPercent: it.taxPercent ?? 0,
    unit: it.unit,
    active: it.active ?? true,
    deleted: it.deleted ?? false,
    description: it.description ?? null,
    openingStock: it.openingStock ?? null,
    reorderLevel: it.reorderLevel ?? null,
    business: businessRefFromId(it.businessId),
  };
}

const seed: Item[] = [
  {
    id: "i1",
    businessId: "b1",
    name: 'Steel Bracket 4"',
    sku: "SB-004",
    type: "product",
    sellingPrice: 240,
    taxPercent: 18,
    unit: "PCS",
    active: true,
  },
  {
    id: "i2",
    businessId: "b1",
    name: "Wood Panel 8x4",
    sku: "WP-0804",
    type: "product",
    sellingPrice: 1850,
    taxPercent: 12,
    unit: "PCS",
    active: true,
  },
  {
    id: "i3",
    businessId: "b1",
    name: "On-site Installation",
    sku: "SVC-INST",
    type: "service",
    sellingPrice: 1500,
    taxPercent: 18,
    unit: "HRS",
    active: true,
  },
  {
    id: "i4",
    businessId: "b1",
    name: "Annual Maintenance Plan",
    sku: "SVC-AMC",
    type: "service",
    sellingPrice: 12000,
    taxPercent: 18,
    unit: "YR",
    active: true,
  },
  {
    id: "i5",
    businessId: "b1",
    name: "Acrylic Sheet 3mm",
    sku: "AS-003",
    type: "product",
    sellingPrice: 680,
    taxPercent: 18,
    unit: "SQF",
    active: false,
  },
  {
    id: "i6",
    businessId: "b2",
    name: "Cotton Fabric Roll",
    sku: "CF-ROLL",
    type: "product",
    sellingPrice: 4200,
    taxPercent: 5,
    unit: "ROLL",
    active: true,
  },
  {
    id: "i7",
    businessId: "b2",
    name: "Custom Tailoring",
    sku: "SVC-TAIL",
    type: "service",
    sellingPrice: 800,
    taxPercent: 18,
    unit: "PCS",
    active: true,
  },
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
    const token = getJwt();
    if (USE_BACKEND && token) {
      setHydrated(true);
      return;
    }
    setItems(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const token = getJwt();
    if (USE_BACKEND && token) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  useEffect(() => {
    const token = getJwt();
    if (!USE_BACKEND || !token) return;
    const biz = businessId ? parseInt(businessId, 10) : NaN;
    if (!businessId || isNaN(biz)) {
      setItems([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch<ItemDTO[]>(
          `/api/items?businessId.equals=${biz}&size=500&sort=id,desc`,
        );
        if (cancelled) return;
        setItems(list.map(dtoToItem));
      } catch {
        if (cancelled) return;
        setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const itemsRef = useRef<Item[]>(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const upsert = useCallback((it: Item) => {
    const token = getJwt();
    if (USE_BACKEND && token) {
      return (async () => {
        const before = itemsRef.current.find((x) => x.id === it.id);
        const isUpdate = /^\d+$/.test(it.id);
        const dto = itemToDto(it);
        if (!isUpdate) delete dto.id;
        const saved = await apiFetch<ItemDTO>(isUpdate ? `/api/items/${it.id}` : "/api/items", {
          method: isUpdate ? "PUT" : "POST",
          body: JSON.stringify(dto),
        });
        const mapped = dtoToItem(saved);
        setItems((prev) => {
          const exists = prev.some((x) => x.id === mapped.id);
          return exists ? prev.map((x) => (x.id === mapped.id ? mapped : x)) : [mapped, ...prev];
        });
        logAudit({
          module: "item",
          action: before ? "edit" : "create",
          recordId: mapped.id,
          reference: mapped.name,
          refLink: `/items/${mapped.id}`,
          businessId: mapped.businessId,
          before: before ? snapshot(before) : null,
          after: snapshot(mapped),
        });
        return mapped;
      })();
    }
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
    return Promise.resolve(it);
  }, []);

  /** Soft delete — keeps the row but hides it from all surfaces. */
  const remove = useCallback((id: string) => {
    const before = itemsRef.current.find((x) => x.id === id);
    const token = getJwt();
    if (USE_BACKEND && token) {
      (async () => {
        try {
          await apiFetch<void>(`/api/items/${id}`, { method: "DELETE" });
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
          setItems((prev) => prev.filter((x) => x.id !== id));
        } catch {
          // ignore
        }
      })();
      return;
    }
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
    const token = getJwt();
    if (USE_BACKEND && token) {
      const nextActive = !before?.active;
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, active: nextActive } : x)));
      (async () => {
        try {
          await apiFetch<ItemDTO>(`/api/items/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/merge-patch+json" },
            body: JSON.stringify({ id: parseInt(id, 10), active: nextActive }),
          });
          if (before) {
            logAudit({
              module: "item",
              action: "edit",
              recordId: id,
              reference: before.name,
              businessId: before.businessId,
              before: { active: before.active },
              after: { active: nextActive },
            });
          }
        } catch {
          // ignore
        }
      })();
      return;
    }
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
  const scoped = useMemo(
    () => items.filter((x) => !x.deleted && (!businessId || x.businessId === businessId)),
    [items, businessId],
  );

  return { items: scoped, allItems: items, hydrated, upsert, remove, toggleActive };
}

/** Items eligible for invoice/purchase selection: scoped, not deleted, and active. */
export function useSelectableItems(businessId?: string | null) {
  const { items, ...rest } = useItems(businessId);
  const selectable = useMemo(() => items.filter((x) => x.active), [items]);
  return { items: selectable, ...rest };
}
