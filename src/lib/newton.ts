import { Dual } from './Dual';

export interface NewtonStep {
  x: number;       // x_{n+1} (after applying the update)
  fx: number;      // f(x_n)
  dfx: number;     // f'(x_n)
  prev: number;    // x_n
}

// f(x) = x^3 - 2x - 5
export function newtonStep(prev: number): NewtonStep {
  const X = Dual.v(prev);
  const r = X.pow(3).sub(Dual.c(2).mul(X)).sub(Dual.c(5));
  const fx = r.re;
  const dfx = r.du;
  return { prev, fx, dfx, x: prev - fx / dfx };
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
