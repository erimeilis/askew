import { describe, it, expect } from "vitest";
import {
  resolveTheme,
  nextThemeChoice,
  themeAttribute,
  isThemeChoice,
} from "@/editor/theme/themeResolution";

describe("resolveTheme (stored choice + system preference -> applied theme)", () => {
  it("an explicit light choice stays light regardless of the system", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("light", false)).toBe("light");
  });

  it("an explicit dark choice stays dark regardless of the system", () => {
    expect(resolveTheme("dark", true)).toBe("dark");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("'system' follows the OS/browser preference", () => {
    expect(resolveTheme("system", true)).toBe("dark");
    expect(resolveTheme("system", false)).toBe("light");
  });
});

describe("nextThemeChoice (the toggle's state machine)", () => {
  it("cycles system -> light -> dark -> system", () => {
    expect(nextThemeChoice("system")).toBe("light");
    expect(nextThemeChoice("light")).toBe("dark");
    expect(nextThemeChoice("dark")).toBe("system");
  });
});

describe("themeAttribute (the data-theme value styles.css keys off)", () => {
  it("clears the attribute for 'system', so the @media block decides", () => {
    expect(themeAttribute("system")).toBeNull();
  });
  it("passes explicit choices through unchanged", () => {
    expect(themeAttribute("light")).toBe("light");
    expect(themeAttribute("dark")).toBe("dark");
  });
});

describe("isThemeChoice", () => {
  it("accepts the three valid choices", () => {
    expect(isThemeChoice("system")).toBe(true);
    expect(isThemeChoice("light")).toBe(true);
    expect(isThemeChoice("dark")).toBe(true);
  });
  it("rejects anything else, including undefined and stray strings", () => {
    expect(isThemeChoice(undefined)).toBe(false);
    expect(isThemeChoice(null)).toBe(false);
    expect(isThemeChoice("")).toBe(false);
    expect(isThemeChoice("auto")).toBe(false);
    expect(isThemeChoice(1)).toBe(false);
  });
});
