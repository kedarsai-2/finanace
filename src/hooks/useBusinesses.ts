import { useCallback, useEffect, useState } from "react";
import type { Business } from "@/types/business";

const STORAGE_KEY = "bm.businesses";
const ACTIVE_KEY = "bm.activeBusinessId";

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
  const [businesses, setBusinesses] = useState<Business[]>(seed);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const list = read();
    setBusinesses(list);
    const stored =
      typeof window !== "undefined" ? localStorage.getItem(ACTIVE_KEY) : null;
    setActiveId(stored ?? list[0]?.id ?? null);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(businesses));
  }, [businesses, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId, hydrated]);

  const upsert = useCallback((b: Business) => {
    setBusinesses((prev) => {
      const exists = prev.some((p) => p.id === b.id);
      return exists ? prev.map((p) => (p.id === b.id ? b : p)) : [...prev, b];
    });
  }, []);

  const remove = useCallback(
    (id: string) => {
      setBusinesses((prev) => prev.filter((p) => p.id !== id));
      if (activeId === id) {
        setActiveId((curr) => {
          const next = businesses.find((b) => b.id !== id);
          return next?.id ?? null;
        });
      }
    },
    [activeId, businesses],
  );

  return { businesses, activeId, setActiveId, upsert, remove, hydrated };
}
