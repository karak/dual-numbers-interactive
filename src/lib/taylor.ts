import { Dual } from './Dual';
import type { DerivationStep } from './stepRow';

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

// v1 expansion uses an n-around-a Taylor sum so the dashed-tangent style
// approximation curve matches the example block in docs/legacy/index.html.
// (sin' at a is cos(a), cos' is -sin(a), exp' is exp(a) — i.e. cycle by π/2 for sin/cos.)
export function taylorSumAround(fn: TrigFn, a: number, terms: number): (x: number) => number {
  return (x: number): number => {
    let sum = 0;
    let fact = 1;
    for (let k = 0; k < terms; k++) {
      if (k > 0) fact *= k;
      let dk: number;
      if (fn === 'exp') dk = Math.exp(a);
      else if (fn === 'sin') dk = Math.sin(a + (k * Math.PI) / 2);
      else dk = Math.cos(a + (k * Math.PI) / 2);
      sum += (dk * Math.pow(x - a, k)) / fact;
    }
    return sum;
  };
}

// Exact value/derivative via Dual (used for the trig step-row derivation in v1).
export interface TrigComputeResult {
  value: number;
  derivative: number;
}

export function trigCompute(fn: TrigFn, x: number): TrigComputeResult {
  const X = Dual.v(x);
  const r = fn === 'sin' ? X.sin() : fn === 'cos' ? X.cos() : X.exp();
  return { value: r.re, derivative: r.du };
}

const trigLatex: Record<TrigFn, string> = {
  sin: '\\sin(x)',
  cos: '\\cos(x)',
  exp: 'e^x',
};

// v1 derivation rows for the trig example.
// Mirrors `examples.trig.compute(state).steps` in docs/legacy/index.html.
export function taylorSteps(fn: TrigFn, x: number): DerivationStep[] {
  const a = x;
  const X = Dual.v(a);
  const r = fn === 'sin' ? X.sin() : fn === 'cos' ? X.cos() : X.exp();
  const lineExpand =
    fn === 'exp'
      ? `e^{${a}+\\varepsilon} = e^{${a}} \\cdot e^{\\varepsilon} = e^{${a}}(1 + \\varepsilon \\,{\\color{#b8b3a8}+\\, \\tfrac{\\varepsilon^2}{2}+\\cdots})`
      : fn === 'sin'
        ? `\\sin(${a}+\\varepsilon) = \\sin(${a})\\cos(\\varepsilon) + \\cos(${a})\\sin(\\varepsilon) \\;\\;(\\cos\\varepsilon\\to 1,\\;\\sin\\varepsilon\\to\\varepsilon)`
        : `\\cos(${a}+\\varepsilon) = \\cos(${a})\\cos(\\varepsilon) - \\sin(${a})\\sin(\\varepsilon) \\;\\;(\\cos\\varepsilon\\to 1,\\;\\sin\\varepsilon\\to\\varepsilon)`;
  return [
    { latex: `f(x) = ${trigLatex[fn]}` },
    { latex: lineExpand },
    {
      latex: `\\quad = ${r.re.toFixed(4)} + (${r.du.toFixed(4)})\\,\\varepsilon`,
      highlight: true,
    },
    {
      latex: `\\therefore f(${a}) = ${r.re.toFixed(4)}, \\quad f'(${a}) = ${r.du.toFixed(4)}`,
    },
  ];
}
