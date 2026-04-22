import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LedgerEntry, Party } from "@/types/party";
import { logAudit, snapshot } from "@/lib/audit";
import { USE_BACKEND } from "@/lib/flags";
import { apiFetch } from "@/lib/api";
import { getJwt } from "@/lib/auth";

const STORAGE_KEY = "bm.parties";
const LEDGER_KEY = "bm.partyLedger";

const seed: Party[] = [
  {
    id: "p1",
    businessId: "b1",
    name: "Acme Industries",
    type: "customer",
    mobile: "9845011111",
    balance: 24500,
    openingBalance: 24500,
    city: "Bengaluru",
    state: "Karnataka",
  },
  {
    id: "p2",
    businessId: "b1",
    name: "Lotus Stationery",
    type: "supplier",
    mobile: "9845022222",
    balance: -8120,
    openingBalance: -8120,
    city: "Mysuru",
    state: "Karnataka",
  },
  {
    id: "p3",
    businessId: "b1",
    name: "Bright Foods Co.",
    type: "both",
    mobile: "9845033333",
    balance: 0,
    city: "Hubli",
    state: "Karnataka",
  },
  {
    id: "p4",
    businessId: "b1",
    name: "Sundaram Traders",
    type: "customer",
    mobile: "9845044444",
    balance: 132400,
    openingBalance: 132400,
    city: "Bengaluru",
    state: "Karnataka",
  },
  {
    id: "p5",
    businessId: "b1",
    name: "Kavya Logistics",
    type: "supplier",
    mobile: "9845055555",
    balance: -45000,
    openingBalance: -45000,
    city: "Chennai",
    state: "Tamil Nadu",
  },
  {
    id: "p6",
    businessId: "b1",
    name: "Rao & Sons",
    type: "customer",
    mobile: "9845066666",
    balance: 7800,
    openingBalance: 7800,
    city: "Bengaluru",
    state: "Karnataka",
  },
  {
    id: "p7",
    businessId: "b2",
    name: "Marigold Exports",
    type: "customer",
    mobile: "9928012345",
    balance: 56000,
    openingBalance: 56000,
    city: "Jaipur",
    state: "Rajasthan",
  },
  {
    id: "p8",
    businessId: "b2",
    name: "Indigo Mills",
    type: "supplier",
    mobile: "9928098765",
    balance: -23400,
    openingBalance: -23400,
    city: "Surat",
    state: "Gujarat",
  },
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

type PartyDTO = {
  id?: number;
  name: string;
  type: "CUSTOMER" | "SUPPLIER" | "BOTH";
  mobile?: string | null;
  email?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  creditLimit?: number | null;
  paymentTermsDays?: number | null;
  openingBalance?: number | null;
  balance?: number | null;
  addressLine1?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressPincode?: string | null;
  deleted?: boolean | null;
  business?: { id: number; name?: string | null } | null;
};

function dtoToParty(dto: PartyDTO): Party {
  const type = dto.type === "CUSTOMER" ? "customer" : dto.type === "SUPPLIER" ? "supplier" : "both";
  const bizId = dto.business?.id;
  const address = {
    line1: dto.addressLine1 ?? undefined,
    city: dto.addressCity ?? undefined,
    state: dto.addressState ?? undefined,
    pincode: dto.addressPincode ?? undefined,
  };
  const opening = dto.openingBalance ?? undefined;
  const bal = dto.balance ?? opening ?? 0;
  return {
    id: String(dto.id ?? ""),
    businessId: bizId != null ? String(bizId) : "",
    name: dto.name,
    type,
    mobile: dto.mobile ?? "",
    email: dto.email ?? undefined,
    address,
    city: address.city,
    state: address.state,
    gstNumber: dto.gstNumber ?? undefined,
    panNumber: dto.panNumber ?? undefined,
    creditLimit: dto.creditLimit ?? undefined,
    paymentTermsDays: dto.paymentTermsDays ?? undefined,
    openingBalance: opening,
    balance: bal,
  };
}

function partyToDto(p: Party): PartyDTO {
  const type = p.type === "customer" ? "CUSTOMER" : p.type === "supplier" ? "SUPPLIER" : "BOTH";
  const businessId = parseInt(p.businessId, 10);
  return {
    id: /^\d+$/.test(p.id) ? parseInt(p.id, 10) : undefined,
    name: p.name,
    type,
    mobile: p.mobile || null,
    email: p.email ?? null,
    gstNumber: p.gstNumber ?? null,
    panNumber: p.panNumber ?? null,
    creditLimit: p.creditLimit ?? null,
    paymentTermsDays: p.paymentTermsDays ?? null,
    openingBalance: p.openingBalance ?? null,
    balance: p.balance ?? null,
    addressLine1: p.address?.line1 ?? null,
    addressCity: p.address?.city ?? p.city ?? null,
    addressState: p.address?.state ?? p.state ?? null,
    addressPincode: p.address?.pincode ?? null,
    deleted: false,
    business: isNaN(businessId) ? null : { id: businessId },
  };
}

export function useParties(businessId?: string | null) {
  const [parties, setParties] = useState<Party[]>(seed);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const token = getJwt();
    if (!USE_BACKEND || !token) {
      setParties(readJson<Party[]>(STORAGE_KEY, seed));
      setLedger(readJson<LedgerEntry[]>(LEDGER_KEY, []));
      setHydrated(true);
      return;
    }
    // Backend mode: load parties from API when businessId changes.
    setLedger([]); // ledger is local-only today
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const token = getJwt();
    if (USE_BACKEND && token) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parties));
  }, [parties, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const token = getJwt();
    if (USE_BACKEND && token) return;
    localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  }, [ledger, hydrated]);

  useEffect(() => {
    const token = getJwt();
    if (!USE_BACKEND || !token) return;
    const biz = businessId ? parseInt(businessId, 10) : NaN;
    if (!businessId || isNaN(biz)) {
      setParties([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await apiFetch<PartyDTO[]>(
          `/api/parties?businessId.equals=${biz}&size=200&sort=id,desc`,
        );
        if (cancelled) return;
        setParties(list.map(dtoToParty));
      } catch {
        if (cancelled) return;
        setParties([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const partiesRef = useRef<Party[]>(parties);
  useEffect(() => {
    partiesRef.current = parties;
  }, [parties]);

  const remove = useCallback((id: string) => {
    const before = partiesRef.current.find((p) => p.id === id);
    const token = getJwt();
    if (USE_BACKEND && token) {
      (async () => {
        try {
          await apiFetch<void>(`/api/parties/${id}`, { method: "DELETE" });
          setParties((prev) => prev.filter((p) => p.id !== id));
        } catch {
          // ignore; UI will remain unchanged
        }
      })();
      return;
    }

    setParties((prev) => prev.filter((p) => p.id !== id));
    setLedger((prev) => prev.filter((e) => e.partyId !== id));
    if (before) {
      logAudit({
        module: "party",
        action: "delete",
        recordId: id,
        reference: before.name,
        businessId: before.businessId,
        before: snapshot(before),
      });
    }
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
    const token = getJwt();
    if (USE_BACKEND && token) {
      return (async () => {
        const isUpdate = /^\d+$/.test(p.id);
        const dto = partyToDto(p);
        // For create, omit id to avoid error.idexists.
        if (!isUpdate) delete dto.id;

        const saved = await apiFetch<PartyDTO>(isUpdate ? `/api/parties/${p.id}` : "/api/parties", {
          method: isUpdate ? "PUT" : "POST",
          body: JSON.stringify(dto),
        });
        const mapped = dtoToParty(saved);
        setParties((prev) => {
          const exists = prev.some((x) => x.id === mapped.id);
          return exists ? prev.map((x) => (x.id === mapped.id ? mapped : x)) : [mapped, ...prev];
        });
        return mapped;
      })();
    }

    const before = partiesRef.current.find((x) => x.id === p.id);
    const stamped: Party = before
      ? { ...p, createdAt: before.createdAt ?? p.createdAt }
      : { ...p, createdAt: p.createdAt ?? new Date().toISOString() };
    setParties((prev) => {
      const exists = prev.some((x) => x.id === stamped.id);
      return exists
        ? prev.map((x) => (x.id === stamped.id ? stamped : x))
        : [...prev, stamped];
    });
    logAudit({
      module: "party",
      action: before ? "edit" : "create",
      recordId: stamped.id,
      reference: stamped.name,
      refLink: `/parties/${stamped.id}`,
      businessId: stamped.businessId,
      before: before ? snapshot(before) : null,
      after: snapshot(stamped),
    });
    setLedger((prev) => {
      const filtered = prev.filter(
        (e) => !(e.partyId === stamped.id && e.note === "Opening balance"),
      );
      if (!stamped.openingBalance) return filtered;
      return [
        ...filtered,
        {
          id: `le_${stamped.id}_opening`,
          partyId: stamped.id,
          date: stamped.createdAt ?? new Date().toISOString(),
          note: "Opening balance",
          amount: stamped.openingBalance,
          type: "opening" as const,
          refNo: "OPEN",
        },
      ];
    });
    return Promise.resolve(stamped);
  }, []);

  const scoped = useMemo(
    () => (businessId ? parties.filter((p) => p.businessId === businessId) : parties),
    [parties, businessId],
  );

  return {
    parties: scoped,
    allParties: parties,
    ledger,
    hydrated,
    remove,
    upsert,
    upsertLedgerEntry,
    removeLedgerEntry,
  };
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
