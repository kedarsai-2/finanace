import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toNumId, toStrId, businessRefFromId } from "./dto";
import { composeNotesWithMeta, extractMetaFromNotes } from "./documentMeta";
import {
  hasAnyProof,
  parseProofAttachments,
  primaryProofUrl,
  stringifyProofAttachments,
} from "./proofAttachments";
import { emptyToUndef, businessFormSchema } from "./businessSchema";
import { itemFormSchema } from "./itemSchema";
import { partyFormSchema } from "./partySchema";
import { buildAccountTxns, accountBalance } from "./accountLedger";
import { buildDashboardSnapshot, buildPartyHistorySnapshot } from "./aiContext";
import { clearJwt, getJwt, setJwt, subscribeAuth } from "./auth";
import { notifyBmStorageSync, subscribeBmStorageSync } from "./bmStorageSync";
import { verifyActionPassword } from "./actionPassword";
import { apiFetch, ApiError } from "./api";
import { buildShareMessage, buildWhatsAppUrl, copyShareText, invoicePrintUrl } from "./share";

describe("dto helpers", () => {
  it("converts ids safely", () => {
    expect(toStrId(null)).toBe("");
    expect(toStrId(12)).toBe("12");
    expect(toNumId("42")).toBe(42);
    expect(toNumId(Number.NaN)).toBeNull();
    expect(businessRefFromId("x")).toBeNull();
    expect(businessRefFromId("7")).toEqual({ id: 7 });
  });
});

describe("document meta", () => {
  it("composes and extracts meta in notes", () => {
    const notes = composeNotesWithMeta("hello", { cnPaymentMode: "cash" });
    const parsed = extractMetaFromNotes(notes);
    expect(parsed.meta.cnPaymentMode).toBe("cash");
    expect(parsed.cleanNotes).toBe("hello");
  });
});

describe("proof attachments", () => {
  it("supports legacy single image payload", () => {
    const parsed = parseProofAttachments("https://img", "bill.png");
    expect(parsed.imageUrl).toBe("https://img");
    expect(hasAnyProof("https://img", "bill.png")).toBe(true);
    expect(primaryProofUrl("https://img", "bill.png")).toBe("https://img");
  });

  it("round-trips multi-attachment payload", () => {
    const encoded = stringifyProofAttachments({
      imageUrl: "a",
      imageName: "a.png",
      documentUrl: "b",
      documentName: "b.pdf",
    });
    const parsed = parseProofAttachments(encoded.proofDataUrl, encoded.proofName);
    expect(parsed.documentUrl).toBe("b");
    expect(parsed.imageName).toBe("a.png");
  });
});

describe("schemas", () => {
  it("validates business, item and party forms", () => {
    expect(
      businessFormSchema.safeParse({
        name: "Biz",
        ownerName: "",
        mobile: "9876543210",
        email: "",
        billingAddress: { line1: "", line2: "", city: "", state: "", pincode: "" },
        shippingSameAsBilling: true,
        shippingAddress: { line1: "", line2: "", city: "", state: "", pincode: "" },
        gstNumber: "",
        panNumber: "",
        logoUrl: "",
        currency: "INR",
        fyStartMonth: 4,
      }).success,
    ).toBe(true);

    expect(
      itemFormSchema.safeParse({
        name: "Item",
        type: "product",
        sku: "",
        sellingPrice: 10,
        purchasePrice: 5,
        taxPercent: 18,
        unit: "pcs",
        openingStock: 0,
        reorderLevel: 0,
        description: "",
        active: true,
      }).success,
    ).toBe(true);

    expect(
      partyFormSchema.safeParse({
        name: "Party",
        mobile: "9876543210",
        email: "",
        address: { line1: "", city: "", state: "", pincode: "" },
        gstNumber: "",
        panNumber: "",
        creditLimit: 0,
        paymentTermsDays: 10,
        openingAmount: 0,
        balanceSide: "receivable",
      }).success,
    ).toBe(true);

    expect(emptyToUndef("   ")).toBeUndefined();
  });
});

describe("account ledger", () => {
  it("builds transactions and computes balance", () => {
    const txns = buildAccountTxns({
      account: {
        id: "a1",
        businessId: "b1",
        name: "Cash",
        type: "cash",
        openingBalance: 100,
        createdAt: "2026-01-01",
      } as any,
      payments: [
        {
          id: "p1",
          accountId: "a1",
          direction: "in",
          amount: 50,
          date: "2026-01-02",
          allocations: [],
          reference: "R1",
        } as any,
      ],
      transfers: [],
      expenses: [{ id: "e1", accountId: "a1", amount: 20, date: "2026-01-03", category: "Office" } as any],
      accountsById: {},
    });
    expect(txns.length).toBe(3);
    expect(accountBalance(txns)).toBe(130);
  });
});

describe("ai snapshots", () => {
  it("generates dashboard and party snapshots", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-15T00:00:00Z"));
    const invoices = [
      {
        id: "i1",
        partyId: "pt1",
        partyName: "Acme",
        number: "INV-1",
        date: "2026-04-01",
        total: 100,
        paidAmount: 20,
        status: "final",
      },
    ] as any;
    const dashboard = buildDashboardSnapshot({
      currency: "INR",
      invoices,
      purchases: [],
      payments: [],
      expenses: [{ category: "Rent", amount: 30, date: "2026-04-05" }] as any,
      parties: [{ id: "pt1", name: "Acme" }] as any,
    });
    expect(dashboard.totals.receivable).toBe(80);
    expect(dashboard.expenseByCategory[0].category).toBe("Rent");

    const party = buildPartyHistorySnapshot({
      party: { id: "pt1", name: "Acme" } as any,
      invoices,
      payments: [],
    });
    expect(party.outstanding).toBe(80);
    vi.useRealTimers();
  });
});

describe("auth and storage sync", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("stores jwt and emits auth events", () => {
    const cb = vi.fn();
    const unsub = subscribeAuth(cb);
    setJwt("tok");
    expect(getJwt()).toBe("tok");
    clearJwt();
    expect(getJwt()).toBeNull();
    expect(cb).toHaveBeenCalled();
    unsub();
  });

  it("notifies same-tab storage listeners", async () => {
    const cb = vi.fn();
    const unsub = subscribeBmStorageSync("k1", cb);
    notifyBmStorageSync("k1");
    await Promise.resolve();
    expect(cb).toHaveBeenCalledTimes(1);
    unsub();
  });
});

describe("action password", () => {
  it("returns false for invalid setup flow", () => {
    vi.spyOn(window, "prompt").mockImplementationOnce(() => "12");
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    expect(verifyActionPassword()).toBe(false);
    expect(alertSpy).toHaveBeenCalled();
  });
});

describe("api + share utilities", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates share content and whatsapp url", () => {
    const msg = buildShareMessage({
      partyName: "Ram",
      invoiceNumber: "INV-10",
      pdfUrl: "https://x/pdf",
    });
    expect(msg).toContain("INV-10");
    expect(buildWhatsAppUrl({ partyName: "Ram", invoiceNumber: "INV-10", pdfUrl: "x", phone: "098-765" })).toContain(
      "wa.me/98765",
    );
    expect(invoicePrintUrl("abc")).toContain("/invoices/abc/print");
  });

  it("copies share text using clipboard api", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const ok = await copyShareText({ partyName: "P", invoiceNumber: "I", pdfUrl: "u" });
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalled();
  });

  it("throws ApiError on failed api responses", async () => {
    setJwt("abc");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server",
        text: async () => "boom",
      }),
    );
    await expect(apiFetch("/x")).rejects.toBeInstanceOf(ApiError);
  });
});
