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
  div(b: Dual): Dual {
    const r = b.re;
    return new Dual(this.re / r, (this.du * r - this.re * b.du) / (r * r));
  }
  neg(): Dual {
    return new Dual(-this.re, -this.du);
  }
}
