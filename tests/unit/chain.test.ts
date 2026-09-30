import { describe, it, expect } from 'vitest';
import { chainCompute, chainSteps } from '../../src/lib/chain';

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
  it('cos(x^3) at x=1 → value=cos(1), derivative=-3 sin(1)', () => {
    const r = chainCompute(1, 'cube', 'cos');
    expect(eq(r.value, Math.cos(1)) && eq(r.derivative, -3 * Math.sin(1))).toBe(true);
  });
  it('sin(2x) at x=1 → value=sin(2), derivative=2 cos(2)', () => {
    const r = chainCompute(1, 'twox', 'sin');
    expect(eq(r.value, Math.sin(2)) && eq(r.derivative, 2 * Math.cos(2))).toBe(true);
  });
});

describe('chainSteps (v1 derivation rows)', () => {
  it('returns 4 rows in v1 order', () => {
    expect(chainSteps(1, 'sq', 'sin')).toHaveLength(4);
  });
  it('row 0 declares both g and f via the v1 latex labels', () => {
    expect(chainSteps(1, 'sq', 'sin')[0].latex).toBe(
      'g(x) = x^2, \\quad f(u) = \\sin(u)',
    );
    expect(chainSteps(1, 'twox', 'exp')[0].latex).toBe(
      'g(x) = 2x, \\quad f(u) = e^u',
    );
  });
  it('row 2 is highlighted with the f∘g result line', () => {
    const r = chainSteps(1, 'sq', 'exp');
    expect(r[2].highlight).toBe(true);
    expect(r[2].latex).toContain('f(g(1+\\varepsilon))');
  });
});
