import { Dual } from './Dual';
import type { DerivationStep } from './stepRow';

export type Inner = 'sq' | 'cube' | 'twox';
export type Outer = 'sin' | 'cos' | 'exp';

interface InnerSpec {
  apply: (d: Dual) => Dual;
  f: (x: number) => number;
  latex: string;
}
interface OuterSpec {
  apply: (d: Dual) => Dual;
  f: (u: number) => number;
  latex: string;
}

export const inners: Record<Inner, InnerSpec> = {
  sq:   { apply: (d) => d.pow(2),         f: (x) => x * x,        latex: 'x^2' },
  cube: { apply: (d) => d.pow(3),         f: (x) => x * x * x,    latex: 'x^3' },
  twox: { apply: (d) => d.mul(Dual.c(2)), f: (x) => 2 * x,        latex: '2x'  },
};

export const outers: Record<Outer, OuterSpec> = {
  sin: { apply: (d) => d.sin(), f: (u) => Math.sin(u), latex: '\\sin(u)' },
  cos: { apply: (d) => d.cos(), f: (u) => Math.cos(u), latex: '\\cos(u)' },
  exp: { apply: (d) => d.exp(), f: (u) => Math.exp(u), latex: 'e^u'      },
};

export interface ChainResult {
  value: number;
  derivative: number;
}

export function chainCompute(x: number, inner: Inner, outer: Outer): ChainResult {
  const u = inners[inner].apply(Dual.v(x));
  const y = outers[outer].apply(u);
  return { value: y.re, derivative: y.du };
}

// v1 derivation rows for the chain example.
// Mirrors `examples.chain.compute(state).steps` in docs/legacy/index.html.
export function chainSteps(x: number, inner: Inner, outer: Outer): DerivationStep[] {
  const a = x;
  const innerSpec = inners[inner];
  const outerSpec = outers[outer];
  const u = innerSpec.apply(Dual.v(a));
  const y = outerSpec.apply(u);
  return [
    { latex: `g(x) = ${innerSpec.latex}, \\quad f(u) = ${outerSpec.latex}` },
    {
      latex: `g(${a} + \\varepsilon) = ${u.re.toFixed(4)} + (${u.du.toFixed(4)})\\,\\varepsilon`,
    },
    {
      latex: `f(g(${a}+\\varepsilon)) = ${y.re.toFixed(4)} + (${y.du.toFixed(4)})\\,\\varepsilon`,
      highlight: true,
    },
    {
      latex: `(f \\circ g)'(${a}) = f'(g(${a})) \\cdot g'(${a}) = ${y.du.toFixed(4)}`,
    },
  ];
}

export function chainFn(inner: Inner, outer: Outer): (x: number) => number {
  const i = inners[inner];
  const o = outers[outer];
  return (x: number) => o.f(i.f(x));
}
