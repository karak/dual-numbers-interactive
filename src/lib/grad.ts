import { Dual } from './Dual';

export interface GradStepResult {
  x: number;       // x_{n+1}
  fx: number;      // f(x_n)
  dfx: number;     // f'(x_n)
  prev: number;    // x_n
  eta: number;
}

// Plain JS evaluation of f(x) = (x-2)^2 + 1. Kept in lockstep with the
// Dual-number polynomial encoded in `gradStep` so canvas plotting and
// history rows agree without the route re-implementing the same poly.
export function gradF(x: number): number {
  return (x - 2) * (x - 2) + 1;
}

// f(x) = (x - 2)^2 + 1
export function gradStep(prev: number, eta: number): GradStepResult {
  const r = Dual.v(prev).sub(Dual.c(2)).pow(2).add(Dual.c(1));
  const fx = r.re;
  const dfx = r.du;
  return { prev, eta, fx, dfx, x: prev - eta * dfx };
}

// Single source of truth for the gradient-descent divergence threshold.
// f(x) = (x-2)^2 + 1 grows quadratically, so |x|>1e6 implies |f|>1e12 —
// well past anything we can render or use for further iteration.
export const DIVERGE_LIMIT = 1e6;

export interface HistRow {
  x: number;
  fx: number;
}

// 1:1 port of v1's warn predicate at docs/legacy/index.html:L721:
//   !Number.isFinite(last.fx) || Math.abs(last.x) > 1e6
// Empty history is guarded against to avoid a runtime crash; v1 never
// reaches the predicate with an empty history because render() always
// seeds at least one row, but the React route's state initializer
// matches that invariant and the guard documents it explicitly.
export function isGradDiverged(h: ReadonlyArray<HistRow>): boolean {
  if (h.length === 0) return false;
  const last = h[h.length - 1];
  return !Number.isFinite(last.fx) || Math.abs(last.x) > DIVERGE_LIMIT;
}
