import { useCallback, useEffect, useState } from "react";
import type { Party } from "@/types/party";

const STORAGE_KEY = "bm.parties";

const seed: Party[] = [
  { id: "p1", businessId: "b1", name: "Acme Industries", type: "customer", mobile: "9845011111", balance: 24500, city: "Bengaluru", state: "Karnataka" },
  { id: "p2", businessId: "b1", name: "Lotus Stationery", type: "supplier", mobile: "9845022222", balance: -8120, city: "Mysuru", state: "Karnataka" },
  { id: "p3", businessId: "b1", name: "Bright Foods Co.", type: "both", mobile: "9845033333", balance: 0, city: "Hubli", state: "Karnataka" },
  { id: "p4", businessId: "b1", name: "Sundaram Traders", type: "customer", mobile: "9845044444", balance: 132400, city: "Bengaluru", state: "Karnataka" },
  { id: "p5", businessId: "b1", name: "Kavya Logistics", type: "supplier", mobile: "9845055555", balance: -45000, city: "Chennai", state: "Tamil Nadu" },
  { id: "p6", businessId: "b1", name: "Rao & Sons", type: "customer", mobile: "9845066666", balance: 7800, city: "Bengaluru", state: "Karnataka" },
  { id: "p7", businessId: "b2", name: "Marigold Exports", type: "customer", mobile: "9928012345", balance: 56000, city: "Jaipur", state: "Rajasthan" },
  { id: "p8", businessId: "b2", name: "Indigo Mills", type: "supplier", mobile: "9928098765", balance: -23400, city: "Surat", state: "Gujarat" },
];

function read(): Party[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    return JSON.parse(raw) as Party[];
  } catch {
    return seed;
  }
}

export function useParties(businessId?: string | null) {
  const [parties, setParties] = useState<Party[]>(seed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setParties(read());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parties));
  }, [parties, hydrated]);

  const remove = useCallback((id: string) => {
    setParties((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const upsert = useCallback((p: Party) => {
    setParties((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
    });
  }, []);

  const scoped = businessId
    ? parties.filter((p) => p.businessId === businessId)
    : parties;

  return { parties: scoped, allParties: parties, hydrated, remove, upsert };
}

export function formatCurrency(amount: number, currency = "INR") {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  } catch {
    return `₹${Math.abs(amount).toLocaleString("en-IN")}`;
  }
}
