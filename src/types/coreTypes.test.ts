import { describe, expect, it } from "vitest";

import { ACCOUNT_TYPE_LABEL, DEFAULT_ACCOUNT_SEEDS } from "./account";
import { PAYMENT_DIRECTION_LABEL, PAYMENT_MODE_LABEL } from "./payment";
import { DEFAULT_EXPENSE_TYPES } from "./expense";
import { DEFAULT_NOTIFICATION_SETTINGS } from "./notification";

describe("core type constants", () => {
  it("keeps account defaults and labels", () => {
    expect(ACCOUNT_TYPE_LABEL.cash).toBe("Cash");
    expect(DEFAULT_ACCOUNT_SEEDS).toHaveLength(2);
    expect(DEFAULT_ACCOUNT_SEEDS[0].type).toBe("cash");
  });

  it("keeps payment labels", () => {
    expect(PAYMENT_MODE_LABEL.bank).toBe("Bank");
    expect(PAYMENT_DIRECTION_LABEL.in).toBe("Receive");
  });

  it("keeps expense and notification defaults", () => {
    expect(DEFAULT_EXPENSE_TYPES).toEqual(["direct", "indirect"]);
    expect(DEFAULT_NOTIFICATION_SETTINGS.overdueEnabled).toBe(true);
    expect(DEFAULT_NOTIFICATION_SETTINGS.overdueFrequency).toBe("daily");
  });
});
