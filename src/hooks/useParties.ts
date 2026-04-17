import { useCallback, useEffect, useState } from "react";
import type { LedgerEntry, Party } from "@/types/party";

const STORAGE_KEY = "bm.parties";
const LEDGER_KEY = "bm.partyLedger";

const seed: Party[] = [
  { id: "p1", businessId: "b1", name: "Acme Industries", type: "customer", mobile: "9845011111", balance: 24500, openingBalance: 24500, city: "Bengaluru", state: "Karnataka" },
  { id: "p2", businessId: "b1", name: "Lotus Stationery", type: "supplier", mobile: "9845022222", balance: -8120, openingBalance: -8120, city: "Mysuru", state: "Karnataka" },
  { id: "p3", businessId: "b1", name: "Bright Foods Co.", type: "both", mobile: "9845033333", balance: 0, city: "Hubli", state: "Karnataka" },
  { id: "p4", businessId: "b1", name: "Sundaram Traders", type: "customer", mobile: "9845044444", balance: 132400, openingBalance: 132400, city: "Bengaluru", state: "Karnataka" },
  { id: "p5", businessId: "b1", name: "Kavya Logistics", type: "supplier", mobile: "9845055555", balance: -45000, openingBalance: -45000, city: "Chennai", state: "Tamil Nadu" },
  { id: "p6", businessId: "b1", name: "Rao & Sons", type: "customer", mobile: "9845066666", balance: 7800, openingBalance: 7800, city: "Bengaluru", state: "Karnataka" },
  { id: "p7", businessId: "b2", name: "Marigold Exports", type: "customer", mobile: "9928012345", balance: 56000, openingBalance: 56000, city: "Jaipur", state: "Rajasthan" },
  { id: "p8", businessId: "b2", name: "Indigo Mills", type: "supplier", mobile: "9928098765", balance: -23400, openingBalance: -23400, city: "Surat", state: "Gujarat" },
];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useParties(businessId?: string | null) {
  const [parties, setParties] = useState<Party[]>(seed);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setParties(readJson<Party[]>(STORAGE_KEY, seed));
    setLedger(readJson<LedgerEntry[]>(LEDGER_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parties));
  }, [parties, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  }, [ledger, hydrated]);

  const remove = useCallback((id: string) => {
    setParties((prev) => prev.filter((p) => p.id !== id));
    setLedger((prev) => prev.filter((e) => e.partyId !== id));
  }, []);

  /**
   * Upserts a ledger entry by id (replace-by-id). Used by Invoices/Purchases to
   * keep the party ledger in sync when documents are finalised or cancelled.
   * Pass `null`/`undefined` to skip writes; call `removeLedgerEntry(id)` to drop.
   */
  const upsertLedgerEntry = useCallback((entry: LedgerEntry) => {
    setLedger((prev) => {
      const exists = prev.some((e) => e.id === entry.id);
      return exists ? prev.map((e) => (e.id === entry.id ? entry : e)) : [...prev, entry];
    });
  }, []);

  const removeLedgerEntry = useCallback((id: string) => {
    setLedger((prev) => prev.filter((e) => e.id !== id));
  }, []);

  /**
   * Upserts a party. If `openingBalance` changes (or is set on create),
   * a single "Opening balance" ledger entry is recorded for that party.
   */
  const upsert = useCallback((p: Party) => {
    setParties((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
    });
    setLedger((prev) => {
      const filtered = prev.filter(
        (e) => !(e.partyId === p.id && e.note === "Opening balance"),
      );
      if (!p.openingBalance) return filtered;
      return [
        ...filtered,
        {
          id: `le_${p.id}_opening`,
          partyId: p.id,
          date: new Date().toISOString(),
          note: "Opening balance",
          amount: p.openingBalance,
          type: "opening" as const,
          refNo: "OPEN",
        },
      ];
    });
  }, []);

  const scoped = businessId
    ? parties.filter((p) => p.businessId === businessId)
    : parties;

  return { parties: scoped, allParties: parties, ledger, hydrated, remove, upsert, upsertLedgerEntry, removeLedgerEntry };
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
