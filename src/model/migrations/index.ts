/** Each migration upgrades from version n to n+1. Add a new function when `Plan.version` changes. */
type Migration = (raw: Record<string, unknown>) => Record<string, unknown>;
const migrations: Record<number, Migration> = {};
export const CURRENT_VERSION = 1;
export function migrate(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  let doc = raw as Record<string, unknown>;
  let v = typeof doc.version === 'number' ? doc.version : CURRENT_VERSION;
  while (v < CURRENT_VERSION) { const step = migrations[v]; if (!step) break; doc = { ...step(doc), version: v + 1 }; v++; }
  return doc;
}
