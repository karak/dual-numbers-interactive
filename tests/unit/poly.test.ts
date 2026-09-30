import { describe, it, expect } from 'vitest';
import { polyCompute, polyF, polySteps } from '../../src/lib/poly';

const eq = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('polyF (f(x) = x^3 - 2x^2 + x - 1)', () => {
  it('f(2) = 8 - 8 + 2 - 1 = 1', () => expect(eq(polyF(2), 1)).toBe(true));
  it('f(0) = -1', () => expect(eq(polyF(0), -1)).toBe(true));
});

describe('polyCompute', () => {
  it('f(2) = 1, f\'(2) = 5', () => {
    const r = polyCompute(2);
    expect(eq(r.value, 1) && eq(r.derivative, 5)).toBe(true);
  });
  it('f(0) = -1, f\'(0) = 1', () => {
    const r = polyCompute(0);
    expect(eq(r.value, -1) && eq(r.derivative, 1)).toBe(true);
  });
});

describe('polySteps (v1 derivation rows)', () => {
  it('returns 5 rows in v1 order', () => {
    const rows = polySteps(1);
    expect(rows).toHaveLength(5);
  });
  it('first row matches v1: f(x) = x^3 - 2x^2 + x - 1', () => {
    expect(polySteps(1)[0].latex).toBe('f(x) = x^3 - 2x^2 + x - 1');
  });
  it('row 4 (0-indexed 3) is highlighted with the result line', () => {
    const r = polySteps(2);
    expect(r[3].highlight).toBe(true);
    expect(r[3].latex).toContain('\\because \\varepsilon^2 = 0');
  });
  it('last row uses \\therefore and contains f(2) result', () => {
    const r = polySteps(2);
    expect(r[4].latex).toContain('\\therefore');
    expect(r[4].latex).toContain('f(2) = 1.0000');
    expect(r[4].latex).toContain("f'(2) = 5.0000");
  });
});
