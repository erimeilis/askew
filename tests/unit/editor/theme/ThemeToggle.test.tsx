// @vitest-environment jsdom
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, act } from "@testing-library/react";
import { ThemeToggle } from "@/editor/theme/ThemeToggle";
import { useThemeStore } from "@/editor/theme/themeStore";
import { kv } from "@/persistence/browser/kv";
import { STORAGE_CONFIG } from "@/config/storage";
import { t } from "@/i18n";

describe("ThemeToggle", () => {
  beforeEach(async () => {
    await kv.del(STORAGE_CONFIG.themeKey);
    document.documentElement.removeAttribute("data-theme");
    useThemeStore.setState({ choice: null, systemPrefersDark: false, applied: "light" });
  });

  afterEach(() => cleanup());

  it("starts announcing 'system', naming what's actually rendering (jsdom has no OS preference, so light)", async () => {
    render(<ThemeToggle />);
    const expected = t("theme.current.system", { applied: t("theme.light") });
    await waitFor(() => expect(screen.getByRole("button", { name: expected })).toBeTruthy());
  });

  it("cycles system -> light -> dark -> system on click, updating the accessible name and data-theme each time", async () => {
    render(<ThemeToggle />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: t("theme.current.system", { applied: t("theme.light") }),
        }),
      ).toBeTruthy(),
    );

    act(() => fireEvent.click(screen.getByRole("button")));
    expect(
      screen.getByRole("button", { name: t("theme.current", { state: t("theme.light") }) }),
    ).toBeTruthy();
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    act(() => fireEvent.click(screen.getByRole("button")));
    expect(
      screen.getByRole("button", { name: t("theme.current", { state: t("theme.dark") }) }),
    ).toBeTruthy();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    act(() => fireEvent.click(screen.getByRole("button")));
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: t("theme.current.system", { applied: t("theme.light") }),
        }),
      ).toBeTruthy(),
    );
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });

  it("persists the choice via kv (IndexedDB), never localStorage", async () => {
    render(<ThemeToggle />);
    await waitFor(() => expect(useThemeStore.getState().choice).toBe("system"));

    act(() => fireEvent.click(screen.getByRole("button")));
    await new Promise((r) => setTimeout(r, 0));
    expect(await kv.get<string>(STORAGE_CONFIG.themeKey)).toBe("light");
  });
});
