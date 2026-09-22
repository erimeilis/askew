import type { Vec } from "@/geometry/vec";

/** DXF numbers are written with up to 3 decimal places, trailing zeros stripped. */
const num = (v: number): string => String(Math.round(v * 1000) / 1000);

export interface DxfLayer {
  name: string;
  color: number;
}

/**
 * Low-level ASCII DXF (group-code) writer: builds a minimal but valid R2000 (AC1015-class)
 * file — HEADER, a TABLES section with only the LAYER table, and ENTITIES — as plain strings.
 * No DOM, no filesystem; `toString()` is the whole output.
 *
 * Every entity and layer gets a unique hex handle (group 5), assigned in call order starting
 * at 0x100. `$HANDSEED` is computed in `toString()` from the handle counter as it stood right
 * after the caller's own `polyline`/`line`/`text`/`arc` calls (plus a fixed margin), which is
 * always above every handle actually written, including the handful the LAYER table itself
 * consumes while `toString()` runs.
 */
export class DxfWriter {
  private ents: string[] = [];
  private handle = 0x100;

  constructor(private opts: { version: string; insunits: number; layers: DxfLayer[] }) {}

  private nextHandle(): string {
    return (this.handle++).toString(16).toUpperCase();
  }

  private tag(code: number, v: string | number): string {
    return `${code}\n${typeof v === "number" ? num(v) : v}\n`;
  }

  private entity(type: string, layer: string, subclass: string, body: string): void {
    this.ents.push(
      this.tag(0, type) +
        this.tag(5, this.nextHandle()) +
        this.tag(100, "AcDbEntity") +
        this.tag(8, layer) +
        this.tag(100, subclass) +
        body,
    );
  }

  polyline(layer: string, pts: Vec[], closed: boolean): void {
    const verts = pts.map((p) => this.tag(10, p.x) + this.tag(20, p.y)).join("");
    this.entity(
      "LWPOLYLINE",
      layer,
      "AcDbPolyline",
      this.tag(90, pts.length) + this.tag(70, closed ? 1 : 0) + verts,
    );
  }

  line(layer: string, a: Vec, b: Vec): void {
    this.entity(
      "LINE",
      layer,
      "AcDbLine",
      this.tag(10, a.x) +
        this.tag(20, a.y) +
        this.tag(30, 0) +
        this.tag(11, b.x) +
        this.tag(21, b.y) +
        this.tag(31, 0),
    );
  }

  text(layer: string, at: Vec, height: number, str: string): void {
    this.entity(
      "TEXT",
      layer,
      "AcDbText",
      this.tag(10, at.x) +
        this.tag(20, at.y) +
        this.tag(30, 0) +
        this.tag(40, height) +
        this.tag(1, str) +
        this.tag(72, 1) +
        this.tag(11, at.x) +
        this.tag(21, at.y) +
        this.tag(31, 0) +
        this.tag(100, "AcDbText"),
    );
  }

  arc(layer: string, c: Vec, r: number, startDeg: number, endDeg: number): void {
    this.entity(
      "ARC",
      layer,
      "AcDbCircle",
      this.tag(10, c.x) +
        this.tag(20, c.y) +
        this.tag(30, 0) +
        this.tag(40, r) +
        this.tag(100, "AcDbArc") +
        this.tag(50, startDeg) +
        this.tag(51, endDeg),
    );
  }

  toString(): string {
    const t = this.tag.bind(this);
    const header =
      t(0, "SECTION") +
      t(2, "HEADER") +
      t(9, "$ACADVER") +
      t(1, this.opts.version) +
      t(9, "$INSUNITS") +
      t(70, this.opts.insunits) +
      t(9, "$HANDSEED") +
      t(5, (this.handle + 1000).toString(16).toUpperCase()) +
      t(0, "ENDSEC");
    const layers = this.opts.layers
      .map(
        (l) =>
          t(0, "LAYER") +
          t(5, this.nextHandle()) +
          t(100, "AcDbSymbolTableRecord") +
          t(100, "AcDbLayerTableRecord") +
          t(2, l.name) +
          t(70, 0) +
          t(62, l.color) +
          t(6, "CONTINUOUS"),
      )
      .join("");
    const tables =
      t(0, "SECTION") +
      t(2, "TABLES") +
      t(0, "TABLE") +
      t(2, "LAYER") +
      t(5, this.nextHandle()) +
      t(100, "AcDbSymbolTable") +
      t(70, this.opts.layers.length) +
      layers +
      t(0, "ENDTAB") +
      t(0, "ENDSEC");
    const entities = t(0, "SECTION") + t(2, "ENTITIES") + this.ents.join("") + t(0, "ENDSEC");
    return header + tables + entities + t(0, "EOF");
  }
}
