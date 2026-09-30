import { describe, it, expect } from 'vitest';
import { makePlotMap } from '../../src/lib/plot';

const eq = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('makePlotMap', () => {
  it('maps domain mid to canvas mid x', () => {
    const m = makePlotMap({ xMin: -1, xMax: 1, yMin: -1, yMax: 1, w: 600, h: 360 });
    expect(eq(m.toX(0), 300)).toBe(true);
    expect(eq(m.toY(0), 180)).toBe(true);
  });
  it('yMax → canvas top', () => {
    const m = makePlotMap({ xMin: 0, xMax: 1, yMin: 0, yMax: 1, w: 100, h: 100 });
    expect(eq(m.toY(1), 0)).toBe(true);
  });
  it('xMax → canvas right edge', () => {
    const m = makePlotMap({ xMin: 0, xMax: 10, yMin: 0, yMax: 1, w: 200, h: 100 });
    expect(eq(m.toX(10), 200)).toBe(true);
  });
});
