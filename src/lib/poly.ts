import { Dual } from './Dual';
import type { DerivationStep } from './stepRow';

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

// v1 derivation rows for the polynomial example.
// Mirrors `examples.poly.compute(state).steps` in docs/legacy/index.html.
export function polySteps(x: number): DerivationStep[] {
  const a = x;
  const X = Dual.v(a);
  const f = X.pow(3).sub(Dual.c(2).mul(X.pow(2))).add(X).sub(Dual.c(1));
  return [
    { latex: 'f(x) = x^3 - 2x^2 + x - 1' },
    {
      latex:
        `f(${a}+\\varepsilon) = (${a}+\\varepsilon)^3 - 2(${a}+\\varepsilon)^2 + (${a}+\\varepsilon) - 1`,
    },
    {
      latex:
        `\\quad = (${(a ** 3).toFixed(2)} + ${(3 * a * a).toFixed(2)}\\varepsilon \\,{\\color{#b8b3a8}+\\, 3\\cdot${a}\\,\\varepsilon^2 + \\varepsilon^3})` +
        ` - 2(${(a * a).toFixed(2)} + ${(2 * a).toFixed(2)}\\varepsilon \\,{\\color{#b8b3a8}+\\,\\varepsilon^2})` +
        ` + ${a} + \\varepsilon - 1`,
    },
    {
      latex:
        `\\quad = ${f.re.toFixed(4)} + (${f.du.toFixed(4)})\\,\\varepsilon \\quad (\\because \\varepsilon^2 = 0)`,
      highlight: true,
    },
    {
      latex: `\\therefore f(${a}) = ${f.re.toFixed(4)}, \\quad f'(${a}) = ${f.du.toFixed(4)}`,
    },
  ];
}
