import { describe, it, expect } from 'vitest';
import { taylor, trueValue } from '../../src/lib/taylor';

const eq = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('trueValue', () => {
  it('sin(0) = 0', () => expect(eq(trueValue('sin', 0), 0)).toBe(true));
  it('cos(0) = 1', () => expect(eq(trueValue('cos', 0), 1)).toBe(true));
  it('exp(1) = e', () => expect(eq(trueValue('exp', 1), Math.E)).toBe(true));
});

describe('taylor (low order: degree-1 partial sum)', () => {
  it('sin at x=0, terms=2 → value=0, derivative=1', () => {
    // partial sum of sin to degree 1 is just x; at x=0 that gives (0, 1)
    const r = taylor('sin', 0, 2);
    expect(eq(r.value, 0) && eq(r.derivative, 1)).toBe(true);
  });
  it('exp at x=0, terms=2 → value=1, derivative=1', () => {
    // partial sum of exp to degree 1 is 1 + x; at x=0 that gives (1, 1)
    const r = taylor('exp', 0, 2);
    expect(eq(r.value, 1) && eq(r.derivative, 1)).toBe(true);
  });
});

describe('taylor (high-order convergence)', () => {
  it('sin at x=π/2 with 15 terms ≈ 1', () => {
    // truncation error of partial sum at terms=10 is ~3.5e-6 at x=π/2;
    // bumping to 15 brings it well under 1e-6 (≈6.6e-10)
    const r = taylor('sin', Math.PI / 2, 15);
    expect(Math.abs(r.value - 1) < 1e-6).toBe(true);
  });
  it('cos at x=0 with 10 terms = 1', () => {
    const r = taylor('cos', 0, 10);
    expect(eq(r.value, 1)).toBe(true);
  });
  it('exp derivative equals value (d/dx e^x = e^x)', () => {
    // partial-sum sanity: derivative is sum_{n=0..terms-2} x^n/n! ≈ value at high terms.
    // At terms=10, x=0.5 the gap is ~5.4e-9 (just over 1e-9); at terms=15 it is ~6.7e-16.
    const r = taylor('exp', 0.5, 15);
    expect(Math.abs(r.derivative - r.value) < 1e-9).toBe(true);
  });
});
