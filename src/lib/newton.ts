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
