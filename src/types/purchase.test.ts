import { describe, expect, it } from "vitest";

import { canEditPurchase, nextPurchaseNumber, purchaseLedgerEntryId } from "./purchase";

describe("purchase helpers", () => {
  it("generates next purchase number scoped by business", () => {
    const value = nextPurchaseNumber(
      [
        { number: "PUR-0002", businessId: "b1" },
        { number: "PUR-0015", businessId: "b1" },
        { number: "PUR-0008", businessId: "b2" },
      ],
      "b1",
    );
    expect(value).toBe("PUR-0016");
  });

  it("checks edit window and ledger id", () => {
    expect(canEditPurchase({ status: "draft", finalizedAt: undefined })).toBe(true);
    expect(canEditPurchase({ status: "cancelled", finalizedAt: undefined })).toBe(false);
    expect(canEditPurchase({ status: "final", finalizedAt: undefined }, { adminOverride: true })).toBe(true);
    expect(purchaseLedgerEntryId("p-1")).toBe("le_pur_p-1");
  });
});
