import { describe, it, expect } from 'vitest';
import { polyCompute, polyF } from '../../src/lib/poly';

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
