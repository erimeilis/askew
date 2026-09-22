import type { Vec } from "@/geometry/vec";

/** Escapes text for safe use as SVG element content or inside a quoted attribute value. */
export function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export type SvgAttrs = Record<string, string | number>;

function attrString(a: SvgAttrs): string {
  return Object.entries(a)
    .map(([k, v]) => ` ${k}="${esc(String(v))}"`)
    .join("");
}

/** A closed `<polygon>` from world points, e.g. a mitred wall outline. */
export function polygon(pts: Vec[], attrs: SvgAttrs = {}): string {
  const points = pts.map((p) => `${p.x},${p.y}`).join(" ");
  return `<polygon points="${points}"${attrString(attrs)}/>`;
}

/** A straight `<line>` between two world points. */
export function line(a: Vec, b: Vec, attrs: SvgAttrs = {}): string {
  return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"${attrString(attrs)}/>`;
}

/** A `<text>` element anchored at a world point; content is escaped. */
export function text(at: Vec, str: string, attrs: SvgAttrs = {}): string {
  return `<text x="${at.x}" y="${at.y}"${attrString(attrs)}>${esc(str)}</text>`;
}

/** A `<path>` element from a ready-made `d` attribute, e.g. an opening's swing-arc symbol. */
export function path(d: string, attrs: SvgAttrs = {}): string {
  return `<path d="${d}"${attrString(attrs)}/>`;
}
