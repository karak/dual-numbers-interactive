import { Dual } from './Dual';

export type TrigFn = 'sin' | 'cos' | 'exp';

export function trueValue(fn: TrigFn, x: number): number {
  if (fn === 'sin') return Math.sin(x);
  if (fn === 'cos') return Math.cos(x);
  return Math.exp(x);
}

export interface TaylorResult {
  value: number;
  derivative: number;
}

// Taylor partial sum at 0, evaluated at x. Uses Dual so derivative is exact.
// terms = number of polynomial terms included (n in {0..terms-1}).
// n=0 is handled as a pure constant to avoid Dual.v(0).pow(0) → NaN derivative.
export function taylor(fn: TrigFn, x: number, terms: number): TaylorResult {
  const X = Dual.v(x);
  let sum = Dual.c(0);
  let factorial = 1;
  for (let n = 0; n < terms; n++) {
    if (n > 0) factorial *= n;
    let coef = 0;
    if (fn === 'exp') coef = 1;
    else if (fn === 'sin') coef = n % 4 === 1 ? 1 : n % 4 === 3 ? -1 : 0;
    else /* cos */ coef = n % 4 === 0 ? 1 : n % 4 === 2 ? -1 : 0;
    if (coef !== 0) {
      const term = n === 0
        ? Dual.c(coef / factorial)
        : Dual.c(coef / factorial).mul(X.pow(n));
      sum = sum.add(term);
    }
  }
  return { value: sum.re, derivative: sum.du };
}
