import { Dual } from './Dual';

export interface NewtonStep {
  x: number;       // x_{n+1} (after applying the update)
  fx: number;      // f(x_n)
  dfx: number;     // f'(x_n)
  prev: number;    // x_n
}

// Plain JS evaluation of f(x) = x^3 - 2x - 5. Kept in lockstep with the
// Dual-number polynomial encoded in `newtonStep` so canvas plotting and
// history rows agree without each route re-implementing the same poly.
export function newtonF(x: number): number {
  return x * x * x - 2 * x - 5;
}

// f(x) = x^3 - 2x - 5
//
// v1 (docs/legacy/index.html:L593) guards against f'(x) ≈ 0:
//   const xn = Math.abs(dfx) < 1e-12 ? x : x - fx / dfx;
// Without the guard, division by ~0 produces ±Infinity (and the next
// iteration cascades to NaN). The guard keeps x in place so the user can
// observe the f' ≈ 0 condition (visualised by the warn predicate).
export function newtonStep(prev: number): NewtonStep {
  const X = Dual.v(prev);
  const r = X.pow(3).sub(Dual.c(2).mul(X)).sub(Dual.c(5));
  const fx = r.re;
  const dfx = r.du;
  const x = Math.abs(dfx) < 1e-12 ? prev : prev - fx / dfx;
  return { prev, fx, dfx, x };
}

// Newton-warning predicate.
//
// v1 (docs/legacy/index.html L638) reads `history[history.length-1].dfx`,
// but the iteration always pushes a fresh row whose `dfx` is `NaN` (the
// derivative is only filled in on the *next* step). So the v1 warning is
// dead code. v2 deliberately deviates: scan from the tail for the most
// recent finite `dfx` and check that one. Pure + readonly for testability.
export function isNewWarningTriggered(
  history: ReadonlyArray<{ dfx: number }>,
): boolean {
  for (let i = history.length - 1; i >= 0; i--) {
    if (Number.isFinite(history[i].dfx)) {
      return Math.abs(history[i].dfx) < 1e-6;
    }
  }
  return false;
}
