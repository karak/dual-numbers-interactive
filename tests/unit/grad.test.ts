import { describe, it, expect } from 'vitest';
import { gradF, gradStep, isGradDiverged } from '../../src/lib/grad';

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

// Subagent review I2 (.claude/plans/rustling-swinging-crescent.md): v1
// (docs/legacy/index.html:L721) divergence predicate is exactly:
//   !Number.isFinite(last.fx) || Math.abs(last.x) > 1e6
// v2 had an extra `!Number.isFinite(last.x)` middle clause. The clause is
// mathematically redundant because (x-2)^2 + 1 maps non-finite x to
// non-finite fx, and even fabricated `{x: Infinity, fx: 0}` is caught by
// the `|x| > 1e6` clause (Math.abs(Infinity) > 1e6 is true).
//
// Pin via source-text assertion: changing the predicate would change the
// function body, and a future re-introduction would fail this test.
describe('isGradDiverged predicate body (I2)', () => {
  it('does not contain the redundant !Number.isFinite(last.x) clause', async () => {
    const fs = await import('node:fs');
    const src = fs.readFileSync('src/lib/grad.ts', 'utf8');
    // The predicate spans across return-statement lines; we look at the
    // function body specifically.
    const fn = src.match(/export function isGradDiverged[\s\S]*?\n\}\n/);
    expect(fn?.[0]).toBeDefined();
    expect(fn?.[0]).not.toContain('!Number.isFinite(last.x)');
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

describe('gradF (f(x) = (x-2)^2 + 1)', () => {
  it('gradF(0) === 5 ((0-2)^2 + 1)', () => {
    expect(gradF(0)).toBe(5);
  });
  it('gradF(2) === 1 (minimum)', () => {
    expect(gradF(2)).toBe(1);
  });
  it('agrees with gradStep.fx at the same x', () => {
    const r = gradStep(5, 0.1);
    expect(gradF(5)).toBe(r.fx);
  });
});
