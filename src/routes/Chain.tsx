import { useState } from 'react';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { drawAxes, drawCurve, drawPoint, makePlotMap } from '../lib/plot';
import { fmt3 } from '../lib/format';
import { chainCompute, type Inner, type Outer } from '../lib/chain';

export function Chain() {
  const [inner, setInner] = useState<Inner>('sq');
  const [outer, setOuter] = useState<Outer>('sin');
  const [x, setX] = useState(1);
  const r = chainCompute(x, inner, outer);
  const fnAt = (xx: number) => chainCompute(xx, inner, outer).value;

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const m = makePlotMap({ xMin: -3, xMax: 3, yMin: -3, yMax: 3, w, h });
    drawAxes(ctx, m);
    drawCurve(ctx, m, fnAt, { color: '#1a1a1a' });
    drawPoint(ctx, m, x, r.value);
  };

  const select = <T extends string>(value: T, onChange: (v: T) => void, options: T[]) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="border border-[var(--color-border)] rounded p-1"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );

  return (
    <article>
      <h2 className="font-[var(--font-ui)] mt-0">連鎖律</h2>
      <div className="flex gap-3 items-center mt-2">
        <span>inner:</span> {select<Inner>(inner, setInner, ['sq', 'cube', 'sin'])}
        <span>outer:</span> {select<Outer>(outer, setOuter, ['sin', 'exp', 'log'])}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-4 mt-4">
        <div>
          <Slider label="x" value={x} min={-3} max={3} step={0.05} onChange={setX} />
          <div className="mt-4 space-y-1">
            <StepRow tex={`f(${fmt3(x)}) = ${fmt3(r.value)}`} highlight />
            <StepRow tex={`f'(${fmt3(x)}) = ${fmt3(r.derivative)}`} highlight />
          </div>
        </div>
        <Plot draw={draw} ariaLabel="合成関数" />
      </div>
    </article>
  );
}
