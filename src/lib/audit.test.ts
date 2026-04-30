import { beforeEach, describe, expect, it } from "vitest";

import { diffRecords, logAudit, readAuditLogs, snapshot } from "./audit";

describe("audit helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("diffs records excluding ignored fields", () => {
    const changes = diffRecords(
      { id: "1", amount: 10, name: "A" },
      { id: "1", amount: 20, name: "A", deleted: true },
    );
    expect(changes).toEqual([{ field: "amount", before: 10, after: 20 }]);
  });

  it("logs create and edit actions", () => {
    logAudit({
      module: "invoice",
      action: "create",
      recordId: "inv1",
      reference: "INV-1",
      after: { amount: 50 },
    });
    logAudit({
      module: "invoice",
      action: "edit",
      recordId: "inv1",
      reference: "INV-1",
      before: { amount: 50 },
      after: { amount: 80 },
    });
    const logs = readAuditLogs();
    expect(logs.length).toBe(2);
    expect(logs[0].action).toBe("create");
    expect(logs[1].changes?.[0].field).toBe("amount");
  });

  it("strips deleted field from snapshots", () => {
    expect(snapshot({ id: "1", deleted: true, name: "Party" })).toEqual({
      id: "1",
      name: "Party",
    });
  });
});
