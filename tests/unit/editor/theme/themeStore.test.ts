// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { useThemeStore } from "@/editor/theme/themeStore";
import { kv } from "@/persistence/browser/kv";
import { STORAGE_CONFIG } from "@/config/storage";

describe("themeStore (choice persisted via kv/IndexedDB, never localStorage)", () => {
  beforeEach(async () => {
    await kv.del(STORAGE_CONFIG.themeKey);
    document.documentElement.removeAttribute("data-theme");
    useThemeStore.setState({ choice: null, systemPrefersDark: false, applied: "light" });
  });

  it("starts unknown until loaded, then defaults to 'system' when nothing was ever chosen", async () => {
    expect(useThemeStore.getState().choice).toBeNull();
    await useThemeStore.getState().loadChoice();
    expect(useThemeStore.getState().choice).toBe("system");
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });

  it("loadChoice reflects a previously persisted explicit choice and sets data-theme", async () => {
    await kv.set(STORAGE_CONFIG.themeKey, "dark");
    await useThemeStore.getState().loadChoice();
    expect(useThemeStore.getState().choice).toBe("dark");
    expect(useThemeStore.getState().applied).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("cycle() advances system -> light -> dark -> system, applying and persisting each step", async () => {
    await useThemeStore.getState().loadChoice(); // system

    useThemeStore.getState().cycle();
    expect(useThemeStore.getState().choice).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    await new Promise((r) => setTimeout(r, 0));
    expect(await kv.get<string>(STORAGE_CONFIG.themeKey)).toBe("light");

    useThemeStore.getState().cycle();
    expect(useThemeStore.getState().choice).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    await new Promise((r) => setTimeout(r, 0));
    expect(await kv.get<string>(STORAGE_CONFIG.themeKey)).toBe("dark");

    useThemeStore.getState().cycle();
    expect(useThemeStore.getState().choice).toBe("system");
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
    await new Promise((r) => setTimeout(r, 0));
    expect(await kv.get<string>(STORAGE_CONFIG.themeKey)).toBe("system");
  });

  it("setSystemPrefersDark recomputes 'applied' for a 'system' choice", async () => {
    useThemeStore.setState({ choice: "system" });
    useThemeStore.getState().setSystemPrefersDark(true);
    expect(useThemeStore.getState().applied).toBe("dark");
    useThemeStore.getState().setSystemPrefersDark(false);
    expect(useThemeStore.getState().applied).toBe("light");
  });

  it("setSystemPrefersDark does not change 'applied' for an explicit choice", async () => {
    useThemeStore.setState({ choice: "light" });
    useThemeStore.getState().setSystemPrefersDark(true);
    expect(useThemeStore.getState().applied).toBe("light");
  });
});
