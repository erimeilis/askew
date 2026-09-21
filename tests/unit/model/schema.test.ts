import { describe, it, expect } from 'vitest';
import { parsePlan } from '@/model/schema';
import { emptyPlan } from '@/model/factory';
describe('parsePlan', () => {
  it('round-trips an empty plan', () => {
    const p = emptyPlan('house');
    expect(parsePlan(JSON.parse(JSON.stringify(p)))).toEqual(p);
    expect(p.floors).toHaveLength(1);
  });
  it('rejects unknown measurement kind', () => {
    const p = emptyPlan('x') as unknown as { measurements: unknown[] };
    p.measurements.push({ id: 'm1', kind: 'volume', value: 1 });
    expect(() => parsePlan(p)).toThrow();
  });
  it('rejects wall referencing a missing point', () => {
    const p = emptyPlan('x');
    p.walls.push({ id: 'w1', floorId: p.floors[0].id, a: 'nope', b: 'nope2', thickness: 0, side: 'left' });
    expect(() => parsePlan(p)).toThrow(/nope/);
  });
});
