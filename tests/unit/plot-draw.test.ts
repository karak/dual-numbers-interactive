import { describe, it, expect } from 'vitest';
import {
  drawAxes,
  drawCurve,
  drawPoint,
  drawTangent,
  makePlotMap,
} from '../../src/lib/plot';

// FakeCtx records every CanvasRenderingContext2D call relevant to plot.ts.
// Cast to CanvasRenderingContext2D when handing to lib fns.
class FakeCtx {
  calls: Array<{ method: string; args: unknown[] }> = [];
  strokeStyle: string | CanvasGradient | CanvasPattern = '';
  fillStyle: string | CanvasGradient | CanvasPattern = '';
  lineWidth = 0;

  save(): void {
    this.calls.push({ method: 'save', args: [] });
  }
  restore(): void {
    this.calls.push({ method: 'restore', args: [] });
  }
  beginPath(): void {
    this.calls.push({ method: 'beginPath', args: [] });
  }
  moveTo(x: number, y: number): void {
    this.calls.push({ method: 'moveTo', args: [x, y] });
  }
  lineTo(x: number, y: number): void {
    this.calls.push({ method: 'lineTo', args: [x, y] });
  }
  stroke(): void {
    this.calls.push({ method: 'stroke', args: [] });
  }
  fill(): void {
    this.calls.push({ method: 'fill', args: [] });
  }
  arc(
    x: number,
    y: number,
    r: number,
    sa: number,
    ea: number,
    ccw?: boolean,
  ): void {
    this.calls.push({ method: 'arc', args: [x, y, r, sa, ea, ccw] });
  }
  setLineDash(dash: number[]): void {
    this.calls.push({ method: 'setLineDash', args: [dash] });
  }
}

const asCtx = (f: FakeCtx): CanvasRenderingContext2D =>
  f as unknown as CanvasRenderingContext2D;

describe('drawAxes', () => {
  it('draws x-axis line when yMin <= 0 <= yMax', () => {
    const ctx = new FakeCtx();
    const m = makePlotMap({ xMin: -1, xMax: 1, yMin: -1, yMax: 1, w: 100, h: 100 });
    drawAxes(asCtx(ctx), m);
    // x-axis: moveTo(0, toY(0)) → lineTo(w, toY(0)) → stroke
    const xAxisMove = ctx.calls.find(
      (c) => c.method === 'moveTo' && c.args[0] === 0,
    );
    expect(xAxisMove).toBeDefined();
    expect(xAxisMove?.args[1]).toBe(m.toY(0));
    const xAxisLine = ctx.calls.find(
      (c) => c.method === 'lineTo' && c.args[0] === m.w,
    );
    expect(xAxisLine).toBeDefined();
    expect(xAxisLine?.args[1]).toBe(m.toY(0));
  });

  it('skips x-axis line when yMin > 0 (axis off-screen)', () => {
    const ctx = new FakeCtx();
    // yMin=1, yMax=10 — x-axis (y=0) is outside the visible y range.
    const m = makePlotMap({ xMin: -1, xMax: 1, yMin: 1, yMax: 10, w: 100, h: 100 });
    drawAxes(asCtx(ctx), m);
    // The horizontal line moveTo(0, toY(0)) must NOT appear.
    const xAxisMove = ctx.calls.find(
      (c) =>
        c.method === 'moveTo' && c.args[0] === 0 && c.args[1] === m.toY(0),
    );
    expect(xAxisMove).toBeUndefined();
  });

  it('draws y-axis line when xMin <= 0 <= xMax', () => {
    const ctx = new FakeCtx();
    const m = makePlotMap({ xMin: -1, xMax: 1, yMin: -1, yMax: 1, w: 100, h: 100 });
    drawAxes(asCtx(ctx), m);
    // y-axis: moveTo(toX(0), 0) → lineTo(toX(0), h) → stroke
    const yAxisMove = ctx.calls.find(
      (c) => c.method === 'moveTo' && c.args[0] === m.toX(0) && c.args[1] === 0,
    );
    expect(yAxisMove).toBeDefined();
    const yAxisLine = ctx.calls.find(
      (c) =>
        c.method === 'lineTo' && c.args[0] === m.toX(0) && c.args[1] === m.h,
    );
    expect(yAxisLine).toBeDefined();
  });

  it('skips y-axis line when xMin > 0 (axis off-screen)', () => {
    const ctx = new FakeCtx();
    // xMin=1, xMax=10 — y-axis (x=0) is outside visible x range.
    const m = makePlotMap({ xMin: 1, xMax: 10, yMin: -1, yMax: 1, w: 100, h: 100 });
    drawAxes(asCtx(ctx), m);
    const yAxisMove = ctx.calls.find(
      (c) => c.method === 'moveTo' && c.args[0] === m.toX(0) && c.args[1] === 0,
    );
    expect(yAxisMove).toBeUndefined();
  });

  it('uses provided borderColor for strokeStyle', () => {
    const ctx = new FakeCtx();
    const m = makePlotMap({ xMin: -1, xMax: 1, yMin: -1, yMax: 1, w: 100, h: 100 });
    drawAxes(asCtx(ctx), m, '#abcdef');
    expect(ctx.strokeStyle).toBe('#abcdef');
  });
});

describe('drawCurve', () => {
  it('emits beginPath → moveTo (first finite) → lineTo* → stroke in order', () => {
    const ctx = new FakeCtx();
    const m = makePlotMap({ xMin: 0, xMax: 1, yMin: 0, yMax: 1, w: 100, h: 100 });
    drawCurve(asCtx(ctx), m, (x) => x);
    const methods = ctx.calls.map((c) => c.method);
    const begin = methods.indexOf('beginPath');
    const firstMove = methods.indexOf('moveTo');
    const firstLine = methods.indexOf('lineTo');
    const stroke = methods.lastIndexOf('stroke');
    expect(begin).toBeGreaterThanOrEqual(0);
    expect(firstMove).toBeGreaterThan(begin);
    expect(firstLine).toBeGreaterThan(firstMove);
    expect(stroke).toBeGreaterThan(firstLine);
  });

  it('skips lineTo for non-finite y values (resets started flag)', () => {
    const ctx = new FakeCtx();
    const m = makePlotMap({ xMin: -1, xMax: 1, yMin: -1, yMax: 1, w: 100, h: 100 });
    // fn(x) returns NaN for x in [-0.2, 0.2], finite elsewhere.
    // Each finite-segment start triggers a fresh moveTo (started=false → true).
    drawCurve(asCtx(ctx), m, (x) => (Math.abs(x) < 0.2 ? NaN : x));
    const moveTos = ctx.calls.filter((c) => c.method === 'moveTo');
    // First finite segment + at least one resumed segment → ≥2 moveTo.
    expect(moveTos.length).toBeGreaterThanOrEqual(2);
  });

  it('respects opts.color, opts.width, opts.dash', () => {
    const ctx = new FakeCtx();
    const m = makePlotMap({ xMin: 0, xMax: 1, yMin: 0, yMax: 1, w: 100, h: 100 });
    drawCurve(asCtx(ctx), m, (x) => x, {
      color: '#ff0000',
      width: 3,
      dash: [4, 2],
    });
    expect(ctx.strokeStyle).toBe('#ff0000');
    expect(ctx.lineWidth).toBe(3);
    const dashCall = ctx.calls.find((c) => c.method === 'setLineDash');
    expect(dashCall).toBeDefined();
    expect(dashCall?.args[0]).toEqual([4, 2]);
  });

  it('omits setLineDash when opts.dash is not provided', () => {
    const ctx = new FakeCtx();
    const m = makePlotMap({ xMin: 0, xMax: 1, yMin: 0, yMax: 1, w: 100, h: 100 });
    drawCurve(asCtx(ctx), m, (x) => x);
    expect(ctx.calls.find((c) => c.method === 'setLineDash')).toBeUndefined();
  });
});

describe('drawPoint', () => {
  it('calls arc and fill at mapped coordinates', () => {
    const ctx = new FakeCtx();
    const m = makePlotMap({ xMin: -1, xMax: 1, yMin: -1, yMax: 1, w: 100, h: 100 });
    drawPoint(asCtx(ctx), m, 0, 0, '#123456');
    const arc = ctx.calls.find((c) => c.method === 'arc');
    expect(arc).toBeDefined();
    expect(arc?.args[0]).toBe(m.toX(0));
    expect(arc?.args[1]).toBe(m.toY(0));
    expect(ctx.fillStyle).toBe('#123456');
    expect(ctx.calls.some((c) => c.method === 'fill')).toBe(true);
  });
});

describe('drawTangent', () => {
  it('calls setLineDash and stroke', () => {
    const ctx = new FakeCtx();
    const m = makePlotMap({ xMin: -1, xMax: 1, yMin: -1, yMax: 1, w: 100, h: 100 });
    drawTangent(asCtx(ctx), m, 0, 0, 1);
    const dashCall = ctx.calls.find((c) => c.method === 'setLineDash');
    expect(dashCall).toBeDefined();
    expect(dashCall?.args[0]).toEqual([6, 4]);
    expect(ctx.calls.some((c) => c.method === 'stroke')).toBe(true);
  });
});
