// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { applyStoredTheme } from "@/editor/theme/applyStoredTheme";
import { kv } from "@/persistence/browser/kv";
import { STORAGE_CONFIG } from "@/config/storage";

describe("applyStoredTheme (pre-mount flash guard)", () => {
  beforeEach(async () => {
    await kv.del(STORAGE_CONFIG.themeKey);
    document.documentElement.removeAttribute("data-theme");
  });

  it("clears data-theme and resolves 'system' when nothing was ever chosen", async () => {
    const choice = await applyStoredTheme();
    expect(choice).toBe("system");
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });

  it("sets data-theme='light' for a persisted explicit light choice", async () => {
    await kv.set(STORAGE_CONFIG.themeKey, "light");
    const choice = await applyStoredTheme();
    expect(choice).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("sets data-theme='dark' for a persisted explicit dark choice", async () => {
    await kv.set(STORAGE_CONFIG.themeKey, "dark");
    const choice = await applyStoredTheme();
    expect(choice).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("falls back to 'system' for a corrupt/invalid persisted value", async () => {
    await kv.set(STORAGE_CONFIG.themeKey, "sepia");
    const choice = await applyStoredTheme();
    expect(choice).toBe("system");
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });
});
