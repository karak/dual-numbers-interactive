import { describe, it, expect } from 'vitest';
import { gradStep } from '../../src/lib/grad';

const eq = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('gradStep (f(x) = (x-2)^2 + 1)', () => {
  it('from x=5, eta=0.1 → df=6, x_next=4.4', () => {
    const r = gradStep(5, 0.1);
    expect(eq(r.dfx, 6) && eq(r.x, 4.4)).toBe(true);
  });
  it('converges to x=2 in 100 steps with eta=0.1', () => {
    let x = 5;
    for (let i = 0; i < 100; i++) x = gradStep(x, 0.1).x;
    expect(Math.abs(x - 2) < 1e-3).toBe(true);
  });
  it('eta=1.2 (overshoot) sends x past 1e6 within ~80 steps', () => {
    let x = 5;
    let i = 0;
    for (; i < 200; i++) {
      x = gradStep(x, 1.2).x;
      if (!Number.isFinite(x) || Math.abs(x) > 1e6) break;
    }
    expect(Math.abs(x) > 1e6 || !Number.isFinite(x)).toBe(true);
    expect(i).toBeLessThan(150);
  });
});
