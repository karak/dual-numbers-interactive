import { describe, it, expect } from 'vitest';
import { newtonF, newtonStep } from '../../src/lib/newton';

const eq = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('newtonStep', () => {
  it('step from x=2: x\'=2.1, f=-1, df=10', () => {
    const r = newtonStep(2);
    expect(eq(r.x, 2.1) && eq(r.fx, -1) && eq(r.dfx, 10)).toBe(true);
  });
  it('converges from x=2 in <10 steps (residual < 1e-9)', () => {
    let x = 2;
    for (let i = 0; i < 10; i++) x = newtonStep(x).x;
    expect(Math.abs(x ** 3 - 2 * x - 5) < 1e-9).toBe(true);
  });

  // v1 has a dfx-near-zero guard at docs/legacy/index.html:L593:
  //   const xn = Math.abs(dfx) < 1e-12 ? x : x - fx / dfx;
  // For f(x) = x^3 - 2x - 5, f'(x) = 3x^2 - 2 = 0 at x = ±sqrt(2/3).
  // Without the guard, fx / dfx produces ±Infinity and the iteration
  // poisons every subsequent step.
  it('does not step when |dfx| < 1e-12 (v1:L593 guard)', () => {
    const x = Math.sqrt(2 / 3); // f'(x) = 0 here
    const r = newtonStep(x);
    expect(Number.isFinite(r.x)).toBe(true);
    expect(r.x).toBe(x); // v1 leaves x in place
    expect(r.dfx).toBeCloseTo(0, 10);
  });
});

describe('newtonF (f(x) = x^3 - 2x - 5)', () => {
  it('newtonF(2) === -1 (8 - 4 - 5)', () => {
    expect(newtonF(2)).toBe(-1);
  });
  it('newtonF(0) === -5', () => {
    expect(newtonF(0)).toBe(-5);
  });
  it('agrees with newtonStep.fx at the same x', () => {
    const r = newtonStep(2);
    expect(newtonF(2)).toBe(r.fx);
  });
});
