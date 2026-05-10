import { describe, it, expect } from 'vitest';
import { gradStep, isGradDiverged } from '../../src/lib/grad';

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

describe('isGradDiverged', () => {
  it('empty history is not diverged', () => {
    expect(isGradDiverged([])).toBe(false);
  });

  it('finite-row history with |x| within 1e6 is not diverged', () => {
    expect(isGradDiverged([{ x: 5, fx: 10 }])).toBe(false);
    expect(isGradDiverged([{ x: 999_999, fx: 1e11 }])).toBe(false);
  });

  it('NaN fx in last row is diverged', () => {
    expect(isGradDiverged([{ x: 5, fx: 10 }, { x: 0, fx: NaN }])).toBe(true);
  });

  it('Infinity fx in last row is diverged', () => {
    expect(isGradDiverged([{ x: 0, fx: Infinity }])).toBe(true);
    expect(isGradDiverged([{ x: 0, fx: -Infinity }])).toBe(true);
  });

  it('Infinity x in last row is diverged', () => {
    expect(isGradDiverged([{ x: Infinity, fx: 0 }])).toBe(true);
  });

  it('|x| > 1e6 in last row is diverged', () => {
    expect(isGradDiverged([{ x: 1.000_001e6, fx: 1e12 }])).toBe(true);
    expect(isGradDiverged([{ x: -2e6, fx: 1e12 }])).toBe(true);
  });

  it('only the LAST row matters; early NaN with finite tail is not diverged', () => {
    expect(
      isGradDiverged([
        { x: 0, fx: NaN },
        { x: 2, fx: 1 },
      ]),
    ).toBe(false);
  });
});
