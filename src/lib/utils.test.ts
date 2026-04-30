import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("merges tailwind classes and removes conflicts", () => {
    const value = cn("px-2 py-1", "px-4", false && "hidden");
    expect(value).toBe("py-1 px-4");
  });
});
