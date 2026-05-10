import { Dual } from './Dual';

export type Inner = 'sq' | 'cube' | 'sin';
export type Outer = 'sin' | 'exp' | 'log';

function applyInner(d: Dual, k: Inner): Dual {
  if (k === 'sq')   return d.pow(2);
  if (k === 'cube') return d.pow(3);
  return d.sin();
}
function applyOuter(d: Dual, k: Outer): Dual {
  if (k === 'sin') return d.sin();
  if (k === 'exp') return d.exp();
  return d.log();
}

export interface ChainResult {
  value: number;
  derivative: number;
}

export function chainCompute(x: number, inner: Inner, outer: Outer): ChainResult {
  const r = applyOuter(applyInner(Dual.v(x), inner), outer);
  return { value: r.re, derivative: r.du };
}
