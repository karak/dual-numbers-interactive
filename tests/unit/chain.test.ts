import { describe, it, expect } from 'vitest';
import { chainCompute } from '../../src/lib/chain';

const eq = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('chainCompute', () => {
  it('sin(x^2) at x=1 → value=sin(1), derivative=2cos(1)', () => {
    const r = chainCompute(1, 'sq', 'sin');
    expect(eq(r.value, Math.sin(1)) && eq(r.derivative, 2 * Math.cos(1))).toBe(true);
  });
  it('exp(x^2) at x=1 → value=e, derivative=2e', () => {
    const r = chainCompute(1, 'sq', 'exp');
    expect(eq(r.value, Math.E) && eq(r.derivative, 2 * Math.E)).toBe(true);
  });
  it('log(x^3) at x=2 → value=ln(8), derivative=3/2', () => {
    const r = chainCompute(2, 'cube', 'log');
    expect(eq(r.value, Math.log(8)) && eq(r.derivative, 3 / 2)).toBe(true);
  });
});
