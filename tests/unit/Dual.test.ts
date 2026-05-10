import { describe, it, expect } from 'vitest';
import { Dual } from '../../src/lib/Dual';

const eq = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('Dual factory', () => {
  it('Dual.c is constant (du = 0)', () => {
    const a = Dual.c(5);
    expect(eq(a.re, 5) && eq(a.du, 0)).toBe(true);
  });
  it('Dual.v is variable (du = 1)', () => {
    const a = Dual.v(3);
    expect(eq(a.re, 3) && eq(a.du, 1)).toBe(true);
  });
});

describe('Dual arithmetic', () => {
  it('add: f(x) = x + 2 at x=3 → f=5, df=1', () => {
    const r = Dual.v(3).add(Dual.c(2));
    expect(eq(r.re, 5) && eq(r.du, 1)).toBe(true);
  });
  it('sub: f(x) = x - 4 at x=10 → f=6, df=1', () => {
    const r = Dual.v(10).sub(Dual.c(4));
    expect(eq(r.re, 6) && eq(r.du, 1)).toBe(true);
  });
  it('mul: f(x) = x*x at x=3 → f=9, df=6', () => {
    const x = Dual.v(3);
    const r = x.mul(x);
    expect(eq(r.re, 9) && eq(r.du, 6)).toBe(true);
  });
  it('div: f(x) = x/2 at x=8 → f=4, df=0.5', () => {
    const r = Dual.v(8).div(Dual.c(2));
    expect(eq(r.re, 4) && eq(r.du, 0.5)).toBe(true);
  });
  it('div quotient rule: f(x)=1/x at x=2 → df=-0.25', () => {
    const r = Dual.c(1).div(Dual.v(2));
    expect(eq(r.re, 0.5) && eq(r.du, -0.25)).toBe(true);
  });
  it('neg: f(x) = -x at x=3 → f=-3, df=-1', () => {
    const r = Dual.v(3).neg();
    expect(eq(r.re, -3) && eq(r.du, -1)).toBe(true);
  });
});

describe('Dual transcendentals', () => {
  it('sin: d/dx sin(x) at x=0 is cos(0)=1', () => {
    const r = Dual.v(0).sin();
    expect(eq(r.re, 0) && eq(r.du, 1)).toBe(true);
  });
  it('cos: d/dx cos(x) at x=π/2 is -1', () => {
    const r = Dual.v(Math.PI / 2).cos();
    expect(eq(r.re, 0) && eq(r.du, -1)).toBe(true);
  });
  it('exp: d/dx e^x at x=1 is e', () => {
    const r = Dual.v(1).exp();
    expect(eq(r.re, Math.E) && eq(r.du, Math.E)).toBe(true);
  });
  it('log: d/dx ln(x) at x=2 is 1/2', () => {
    const r = Dual.v(2).log();
    expect(eq(r.re, Math.log(2)) && eq(r.du, 0.5)).toBe(true);
  });
  it('pow: d/dx x^3 at x=2 is 12', () => {
    const r = Dual.v(2).pow(3);
    expect(eq(r.re, 8) && eq(r.du, 12)).toBe(true);
  });
  it('chain via composition: d/dx sin(x^2) at x=2 = 4 cos(4)', () => {
    const r = Dual.v(2).pow(2).sin();
    expect(eq(r.re, Math.sin(4)) && eq(r.du, 4 * Math.cos(4))).toBe(true);
  });
  it('pow guard: pow(0, n<1) returns NaN derivative when du≠0', () => {
    const r = Dual.v(0).pow(0.5);
    expect(r.re).toBe(0);
    expect(Number.isNaN(r.du)).toBe(true);
  });
  it('pow guard: pow(0, n<1) returns 0 derivative when du=0', () => {
    const r = Dual.c(0).pow(0.5);
    expect(r.re).toBe(0);
    expect(r.du).toBe(0);
  });
});
