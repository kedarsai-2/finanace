import { useCallback, useEffect, useRef, useState } from "react";
import type { Business } from "@/types/business";
import { logAudit, snapshot } from "@/lib/audit";
import { USE_BACKEND } from "@/lib/flags";
import { ApiError, apiFetch } from "@/lib/api";
import { getJwt, subscribeAuth } from "@/lib/auth";

const STORAGE_KEY = "bm.businesses";
const ACTIVE_KEY = "bm.activeBusinessId";
const API_ACTIVE_KEY = "bm.activeBusinessId.api";

const seed: Business[] = [
  {
    id: "b1",
    name: "Nimbus Trading Co.",
    mobile: "9845012345",
    gstNumber: "29ABCDE1234F2Z5",
    city: "Bengaluru",
    state: "Karnataka",
    currency: "INR",
    fyStartMonth: 4,
    hasData: true,
  },
  {
    id: "b2",
    name: "Saffron Textiles",
    mobile: "9928012345",
    city: "Jaipur",
    state: "Rajasthan",
    currency: "INR",
    fyStartMonth: 4,
    hasData: true,
  },
  {
    id: "b3",
    name: "Coastal Foods Pvt Ltd",
    mobile: "9847012345",
    gstNumber: "32AAACR1234N1Z0",
    city: "Kochi",
    state: "Kerala",
    currency: "INR",
    fyStartMonth: 4,
  },
];

function read(): Business[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    return JSON.parse(raw) as Business[];
  } catch {
    return seed;
  }
}

export function useBusinesses() {
  const [token, setToken] = useState<string | null>(() => getJwt());
  const [businesses, setBusinesses] = useState<Business[]>(() => (USE_BACKEND ? [] : seed));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    return subscribeAuth(() => setToken(getJwt()));
  }, []);

  useEffect(() => {
    if (!USE_BACKEND) {
      const list = read();
      setBusinesses(list);
      const stored = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_KEY) : null;
      setActiveId(stored ?? list[0]?.id ?? null);
      setHydrated(true);
      return;
    }
    if (!token) {
      // Backend mode without auth should never fallback to local seed data.
      setBusinesses([]);
      setActiveId(null);
      setHydrated(true);
      return;
    }

    setBusinesses([]); // avoid showing seed data in backend mode
    (async () => {
      try {
        const list = await apiFetch<
          Array<{
            id: number;
            createdAt?: string;
            name: string;
            ownerName?: string;
            mobile?: string;
            email?: string;
            logoUrl?: string;
            gstNumber?: string;
            panNumber?: string;
            city?: string;
            state?: string;
            billingLine1?: string;
            billingLine2?: string;
            billingCity?: string;
            billingState?: string;
            billingPincode?: string;
            shippingSameAsBilling?: boolean;
            shippingLine1?: string;
            shippingLine2?: string;
            shippingCity?: string;
            shippingState?: string;
            shippingPincode?: string;
            currency?: string;
            fyStartMonth?: number;
            hasData?: boolean;
          }>
        >("/api/businesses?size=200&sort=id,asc");

        const mapped: Business[] = list.map((b) => ({
          id: String(b.id),
          createdAt: b.createdAt ?? undefined,
          name: b.name,
          ownerName: b.ownerName ?? undefined,
          mobile: b.mobile ?? "",
          email: b.email ?? undefined,
          logoUrl: b.logoUrl ?? undefined,
          gstNumber: b.gstNumber ?? undefined,
          panNumber: b.panNumber ?? undefined,
          city: b.city ?? "",
          state: b.state ?? "",
          billingAddress: {
            line1: b.billingLine1 ?? undefined,
            line2: b.billingLine2 ?? undefined,
            city: b.billingCity ?? undefined,
            state: b.billingState ?? undefined,
            pincode: b.billingPincode ?? undefined,
          },
          shippingSameAsBilling: b.shippingSameAsBilling ?? true,
          shippingAddress: {
            line1: b.shippingLine1 ?? undefined,
            line2: b.shippingLine2 ?? undefined,
            city: b.shippingCity ?? undefined,
            state: b.shippingState ?? undefined,
            pincode: b.shippingPincode ?? undefined,
          },
          currency: b.currency ?? "INR",
          fyStartMonth: b.fyStartMonth ?? 4,
          hasData: b.hasData ?? undefined,
        }));

        setBusinesses(mapped);
        const stored = typeof window !== "undefined" ? localStorage.getItem(API_ACTIVE_KEY) : null;
        setActiveId(stored ?? mapped[0]?.id ?? null);
      } catch {
        // Backend mode should fail closed (empty state), not show local seed data.
        setBusinesses([]);
        setActiveId(null);
      } finally {
        setHydrated(true);
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!hydrated) return;
    const token = getJwt();
    if (USE_BACKEND && token) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(businesses));
  }, [businesses, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const token = getJwt();
    if (!activeId) return;
    if (USE_BACKEND && token) {
      localStorage.setItem(API_ACTIVE_KEY, activeId);
      return;
    }
    localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId, hydrated]);

  const businessesRef = useRef<Business[]>(businesses);
  useEffect(() => {
    businessesRef.current = businesses;
  }, [businesses]);

  const upsert = useCallback((b: Business) => {
    const token = getJwt();
    if (USE_BACKEND && token) {
      // Backend mode: businesses are managed by the API (not localStorage).
      // Keeping this as a no-op avoids breaking existing UI calls.
      return;
    }
    const before = businessesRef.current.find((p) => p.id === b.id);
    setBusinesses((prev) => {
      const exists = prev.some((p) => p.id === b.id);
      return exists ? prev.map((p) => (p.id === b.id ? b : p)) : [...prev, b];
    });
    logAudit({
      module: "business",
      action: before ? "edit" : "create",
      recordId: b.id,
      reference: b.name,
      refLink: `/businesses`,
      businessId: b.id,
      before: before ? snapshot(before) : null,
      after: snapshot(b),
    });
  }, []);

  const remove = useCallback(
    async (id: string) => {
      const token = getJwt();
      if (USE_BACKEND && token) {
        const before = businessesRef.current.find((p) => p.id === id);
        try {
          await apiFetch<void>(`/api/businesses/${id}`, { method: "DELETE" });
          setBusinesses((prev) => prev.filter((p) => p.id !== id));
          setActiveId((prev) => {
            if (prev !== id) return prev;
            const next = businessesRef.current.find((b) => b.id !== id);
            return next?.id ?? null;
          });
          if (before) {
            logAudit({
              module: "business",
              action: "delete",
              recordId: id,
              reference: before.name,
              businessId: id,
              before: snapshot(before),
            });
          }
          return;
        } catch (err) {
          if (err instanceof ApiError && err.status === 500) {
            throw new Error(
              "This business cannot be deleted because it still has related data (parties, invoices, purchases, etc.).",
            );
          }
          throw err;
        }
      }
      const before = businessesRef.current.find((p) => p.id === id);
      setBusinesses((prev) => prev.filter((p) => p.id !== id));
      if (activeId === id) {
        setActiveId(() => {
          const next = businesses.find((b) => b.id !== id);
          return next?.id ?? null;
        });
      }
      if (before) {
        logAudit({
          module: "business",
          action: "delete",
          recordId: id,
          reference: before.name,
          businessId: id,
          before: snapshot(before),
        });
      }
    },
    [activeId, businesses],
  );

  // When the user picks "All Companies", expose a null scope so
  // downstream hooks (invoices, purchases, parties, …) skip the per-business filter.
  const isAll = activeId === "__all__";
  const scopedBusinessId = isAll ? null : activeId;

  return {
    businesses,
    activeId,
    scopedBusinessId,
    isAll,
    setActiveId,
    upsert,
    remove,
    hydrated,
  };
}
