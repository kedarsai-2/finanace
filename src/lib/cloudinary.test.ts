import { describe, expect, it, vi } from "vitest";

const apiFetchMock = vi.fn();
vi.mock("@/lib/api", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

import { uploadFileToCloudinary, uploadImageToCloudinary } from "./cloudinary";

describe("cloudinary upload helpers", () => {
  it("uploads image successfully", async () => {
    apiFetchMock.mockResolvedValue({
      cloudName: "demo",
      apiKey: "k",
      timestamp: 123,
      signature: "sig",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ secure_url: "https://cdn/image.jpg" }),
      }),
    );

    const file = new File(["x"], "img.jpg", { type: "image/jpeg" });
    const out = await uploadImageToCloudinary(file);
    expect(out.secureUrl).toContain("cdn");
    expect(out.originalFilename).toBe("img.jpg");
  });

  it("throws with upload error message", async () => {
    apiFetchMock.mockResolvedValue({
      cloudName: "demo",
      apiKey: "k",
      timestamp: 123,
      signature: "sig",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: "bad signature" } }),
      }),
    );
    const file = new File(["x"], "doc.pdf", { type: "application/pdf" });
    await expect(uploadFileToCloudinary(file, "raw")).rejects.toThrow("bad signature");
  });
});
