import { Dual } from './Dual';

// f(x) = x^3 - 2x^2 + x - 1
export const polyF = (x: number): number => x ** 3 - 2 * x ** 2 + x - 1;

export interface PolyResult {
  value: number;
  derivative: number;
}

export function polyCompute(x: number): PolyResult {
  const X = Dual.v(x);
  const r = X.pow(3).sub(Dual.c(2).mul(X.pow(2))).add(X).sub(Dual.c(1));
  return { value: r.re, derivative: r.du };
}
