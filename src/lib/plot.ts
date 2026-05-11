export interface PlotBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  w: number;
  h: number;
}

export interface PlotMap extends PlotBounds {
  toX(x: number): number;
  toY(y: number): number;
}

export function makePlotMap(b: PlotBounds): PlotMap {
  return {
    ...b,
    toX: (x) => ((x - b.xMin) / (b.xMax - b.xMin)) * b.w,
    toY: (y) => b.h - ((y - b.yMin) / (b.yMax - b.yMin)) * b.h,
  };
}

export interface CurveOptions {
  color?: string;
  width?: number;
  dash?: number[];
}

export function drawAxes(
  ctx: CanvasRenderingContext2D,
  m: PlotMap,
  borderColor = '#e8e6e0',
): void {
  ctx.save();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  if (m.yMin <= 0 && m.yMax >= 0) {
    ctx.beginPath();
    ctx.moveTo(0, m.toY(0));
    ctx.lineTo(m.w, m.toY(0));
    ctx.stroke();
  }
  if (m.xMin <= 0 && m.xMax >= 0) {
    ctx.beginPath();
    ctx.moveTo(m.toX(0), 0);
    ctx.lineTo(m.toX(0), m.h);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCurve(
  ctx: CanvasRenderingContext2D,
  m: PlotMap,
  fn: (x: number) => number,
  opts: CurveOptions = {},
): void {
  ctx.save();
  ctx.strokeStyle = opts.color ?? '#1a1a1a';
  ctx.lineWidth = opts.width ?? 2;
  if (opts.dash) ctx.setLineDash(opts.dash);
  ctx.beginPath();
  let started = false;
  const N = 600;
  for (let i = 0; i <= N; i++) {
    const x = m.xMin + (m.xMax - m.xMin) * (i / N);
    const y = fn(x);
    if (!Number.isFinite(y)) {
      started = false;
      continue;
    }
    const px = m.toX(x);
    const py = m.toY(y);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
  ctx.restore();
}

export function drawPoint(
  ctx: CanvasRenderingContext2D,
  m: PlotMap,
  x: number,
  y: number,
  color = '#6b4eff',
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(m.toX(x), m.toY(y), 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

export function drawTangent(
  ctx: CanvasRenderingContext2D,
  m: PlotMap,
  x0: number,
  y0: number,
  slope: number,
  color = '#6b4eff',
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(m.toX(m.xMin), m.toY(y0 + slope * (m.xMin - x0)));
  ctx.lineTo(m.toX(m.xMax), m.toY(y0 + slope * (m.xMax - x0)));
  ctx.stroke();
  ctx.restore();
}
