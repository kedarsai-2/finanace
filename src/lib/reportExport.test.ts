import { describe, expect, it, vi } from "vitest";

import { downloadCsv } from "./reportExport";

describe("downloadCsv", () => {
  it("creates blob url and triggers anchor click", () => {
    const click = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      value: vi.fn().mockReturnValue("blob:test"),
      configurable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: vi.fn(),
      configurable: true,
    });
    const createElement = vi.spyOn(document, "createElement").mockImplementation(() => {
      return { click, href: "", download: "" } as unknown as HTMLElement;
    });

    downloadCsv("report.csv", ["Name", "Amount"], [["Ram", 100]]);

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test");
    createElement.mockRestore();
  });
});
