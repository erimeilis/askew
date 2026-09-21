import { describe, it, expect } from "vitest";
import { t, setLocale, registerLocale, availableLocales } from "@/i18n";
describe("i18n", () => {
  it("returns english string with params", () => {
    expect(t("measure.prompt.length", { a: "P1", b: "P2" })).toBe("Length P1 → P2 (mm)");
  });
  it("falls back to key when missing", () => {
    expect(t("nope.missing")).toBe("nope.missing");
  });
  it("switches locale without code change", () => {
    registerLocale("uk", { "tool.room": "Кімната" });
    setLocale("uk");
    expect(t("tool.room")).toBe("Кімната");
    expect(t("tool.measure")).toBe("Measure"); // falls back to en
    expect(availableLocales()).toEqual(["en", "uk"]);
    setLocale("en");
  });
});
