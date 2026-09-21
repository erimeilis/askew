import { describe, it, expect, vi } from "vitest";

vi.mock("@/persistence/browser/kv", () => ({
  kv: {
    get: () => Promise.reject(new Error("indexeddb blocked")),
    set: () => Promise.resolve(),
    del: () => Promise.resolve(),
  },
}));

import { loadAutosave } from "@/persistence/browser/autosave";

describe("loadAutosave error propagation", () => {
  it("rejects rather than swallowing a failed read as null", async () => {
    await expect(loadAutosave()).rejects.toThrow("indexeddb blocked");
  });
});
