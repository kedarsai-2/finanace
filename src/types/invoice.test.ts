import { describe, expect, it } from "vitest";

import {
  canEditInvoice,
  computeTotals,
  lineMath,
  nextInvoiceNumber,
  paymentStatusOf,
} from "./invoice";

describe("invoice helpers", () => {
  it("computes payment status", () => {
    expect(paymentStatusOf({ total: 100, paidAmount: 0, status: "draft" })).toBe("unpaid");
    expect(paymentStatusOf({ total: 100, paidAmount: 40, status: "final" })).toBe("partial");
    expect(paymentStatusOf({ total: 100, paidAmount: 100, status: "final" })).toBe("paid");
    expect(paymentStatusOf({ total: 100, paidAmount: 100, status: "cancelled" })).toBe("unpaid");
  });

  it("calculates line and invoice totals", () => {
    const line = lineMath({
      id: "1",
      name: "A",
      qty: 2,
      unit: "pcs",
      rate: 50,
      discountKind: "percent",
      discountValue: 10,
      taxPercent: 18,
    });
    expect(line.gross).toBe(100);
    expect(line.discount).toBe(10);
    expect(line.total).toBe(90);

    const totals = computeTotals({
      lines: [
        {
          id: "1",
          name: "A",
          qty: 2,
          unit: "pcs",
          rate: 50,
          discountKind: "amount",
          discountValue: 5,
          taxPercent: 0,
        },
      ],
      overallDiscountKind: "percent",
      overallDiscountValue: 10,
    });
    expect(totals.subtotal).toBe(100);
    expect(totals.itemDiscountTotal).toBe(5);
    expect(totals.taxTotal).toBe(0);
    expect(totals.total).toBe(85.5);
  });

  it("generates next invoice number and editability", () => {
    const next = nextInvoiceNumber(
      [
        { number: "INV-0003", businessId: "b1" },
        { number: "INV-0010", businessId: "b1" },
        { number: "INV-0004", businessId: "b2" },
      ],
      "b1",
    );
    expect(next).toBe("INV-0011");

    expect(canEditInvoice({ status: "draft", finalizedAt: undefined })).toBe(true);
    expect(canEditInvoice({ status: "cancelled", finalizedAt: undefined })).toBe(false);
    expect(
      canEditInvoice(
        { status: "final", finalizedAt: "2026-01-01T00:00:00.000Z" },
        { now: new Date("2026-01-01T12:00:00.000Z").getTime() },
      ),
    ).toBe(true);
    expect(
      canEditInvoice(
        { status: "final", finalizedAt: "2026-01-01T00:00:00.000Z" },
        { now: new Date("2026-01-03T12:00:00.000Z").getTime() },
      ),
    ).toBe(false);
  });
});
