export class Dual {
  readonly re: number;
  readonly du: number;

  constructor(re: number, du = 0) {
    this.re = re;
    this.du = du;
  }

  static c(x: number): Dual {
    return new Dual(x, 0);
  }
  static v(x: number): Dual {
    return new Dual(x, 1);
  }

  add(b: Dual): Dual {
    return new Dual(this.re + b.re, this.du + b.du);
  }
  sub(b: Dual): Dual {
    return new Dual(this.re - b.re, this.du - b.du);
  }
  mul(b: Dual): Dual {
    return new Dual(
      this.re * b.re,
      this.re * b.du + this.du * b.re,
    );
  }
  /**
   * Returns this / b. Note: when b.re === 0, re becomes ±Infinity and du
   * becomes NaN (the quotient rule's denominator r² is 0). No exception is
   * thrown; callers must guard inputs if non-finite results are unacceptable.
   */
  div(b: Dual): Dual {
    const r = b.re;
    return new Dual(this.re / r, (this.du * r - this.re * b.du) / (r * r));
  }
  neg(): Dual {
    return new Dual(-this.re, -this.du);
  }
  sin(): Dual {
    return new Dual(Math.sin(this.re), Math.cos(this.re) * this.du);
  }
  cos(): Dual {
    return new Dual(Math.cos(this.re), -Math.sin(this.re) * this.du);
  }
  exp(): Dual {
    const e = Math.exp(this.re);
    return new Dual(e, e * this.du);
  }
  /**
   * Returns natural log. Domain is re > 0; log(0) yields -Infinity, log(negative)
   * yields NaN. The derivative 1/re is also unguarded. No exception is thrown.
   */
  log(): Dual {
    return new Dual(Math.log(this.re), this.du / this.re);
  }
  pow(n: number): Dual {
    const r = Math.pow(this.re, n);
    if (this.re === 0 && n < 1) {
      return new Dual(r, this.du === 0 ? 0 : NaN);
    }
    return new Dual(r, n * Math.pow(this.re, n - 1) * this.du);
  }
}
