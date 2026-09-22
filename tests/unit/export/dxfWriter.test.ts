import { describe, it, expect } from "vitest";
import { DxfWriter } from "@/export/dxf/writer";

describe("DxfWriter", () => {
  it("writes header, layer table and a closed polyline with handles", () => {
    const w = new DxfWriter({
      version: "AC1015",
      insunits: 4,
      layers: [{ name: "walls", color: 7 }],
    });
    w.polyline(
      "walls",
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 5 },
      ],
      true,
    );
    const s = w.toString();
    const lines = s.split("\n");
    expect(lines.slice(0, 4)).toEqual(["0", "SECTION", "2", "HEADER"]);
    expect(s).toContain("9\n$INSUNITS\n70\n4");
    expect(s).toContain("2\nLAYER");
    expect(s).toContain("0\nLWPOLYLINE");
    expect(s).toContain("90\n3");
    expect(s).toContain("70\n1");
    expect(s.trim().endsWith("0\nEOF")).toBe(true);
    const handles = [...s.matchAll(/\n5\n([0-9A-F]+)/g)].map((m) => m[1]);
    expect(new Set(handles).size).toBe(handles.length);
  });

  it("escapes nothing but formats numbers with up to 3 decimals", () => {
    const w = new DxfWriter({ version: "AC1015", insunits: 4, layers: [] });
    w.line("l", { x: 0.12345, y: 0 }, { x: 1, y: 1 });
    expect(w.toString()).toContain("10\n0.123\n");
  });
});
