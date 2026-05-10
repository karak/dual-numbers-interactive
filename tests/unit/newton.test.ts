import { describe, it, expect } from 'vitest';
import { newtonStep } from '../../src/lib/newton';

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
});
