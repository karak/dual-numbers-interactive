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

export const isDiverged = (r: GradStepResult): boolean =>
  Math.abs(r.x) > 1e6 || !Number.isFinite(r.fx) || !Number.isFinite(r.x);
