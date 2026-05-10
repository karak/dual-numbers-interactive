import { Dual } from './Dual';

export interface GradStepResult {
  x: number;       // x_{n+1}
  fx: number;      // f(x_n)
  dfx: number;     // f'(x_n)
  prev: number;    // x_n
  eta: number;
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

// Pure predicate: a divergence happened iff the most recent history row has
// a non-finite fx, a non-finite x, or |x| past DIVERGE_LIMIT. Empty history
// is, by convention, not diverged (the route always seeds with one row).
export function isGradDiverged(h: ReadonlyArray<HistRow>): boolean {
  if (h.length === 0) return false;
  const last = h[h.length - 1];
  return (
    !Number.isFinite(last.fx) ||
    !Number.isFinite(last.x) ||
    Math.abs(last.x) > DIVERGE_LIMIT
  );
}
