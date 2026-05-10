import { useState } from 'react';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { drawAxes, drawCurve, drawPoint, makePlotMap } from '../lib/plot';
import { fmt3 } from '../lib/format';
import { taylor, trueValue, type TrigFn } from '../lib/taylor';

export function Trig() {
  const [fn, setFn] = useState<TrigFn>('sin');
  const [terms, setTerms] = useState(3);
  const [x, setX] = useState(1);

  const t = taylor(fn, x, terms);
  const tv = trueValue(fn, x);

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const m = makePlotMap({ xMin: -4, xMax: 4, yMin: -2, yMax: 4, w, h });
    drawAxes(ctx, m);
    drawCurve(ctx, m, (xx) => trueValue(fn, xx), { color: '#1a1a1a' });
    drawCurve(ctx, m, (xx) => taylor(fn, xx, terms).value, { color: '#6b4eff', dash: [4, 3] });
    drawPoint(ctx, m, x, t.value);
  };

  return (
    <article>
      <h2 className="font-[var(--font-ui)] mt-0">三角関数 / Taylor</h2>
      <div className="flex gap-4 items-center mt-2">
        <label className="font-[var(--font-ui)] text-sm">
          関数:
          <select
            value={fn}
            onChange={(e) => setFn(e.target.value as TrigFn)}
            className="ml-2 border border-[var(--color-border)] rounded p-1"
          >
            <option value="sin">sin</option>
            <option value="cos">cos</option>
            <option value="exp">exp</option>
          </select>
        </label>
        <button
          onClick={() => setTerms((t) => Math.max(1, t - 1))}
          className="border border-[var(--color-border)] rounded px-2 py-1"
        >
          項数 -
        </button>
        <span>項数 = {terms}</span>
        <button
          onClick={() => setTerms((t) => Math.min(20, t + 1))}
          className="border border-[var(--color-border)] rounded px-2 py-1"
        >
          項数 +
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-4 mt-4">
        <div>
          <Slider label="x" value={x} min={-4} max={4} step={0.05} onChange={setX} />
          <div className="mt-4 space-y-1">
            <StepRow tex={`f(${fmt3(x)}) \\approx ${fmt3(t.value)}`} highlight />
            <StepRow tex={`f'(${fmt3(x)}) \\approx ${fmt3(t.derivative)}`} highlight />
            <StepRow tex={`\\text{真値}: ${fmt3(tv)}`} ghost />
          </div>
        </div>
        <Plot draw={draw} ariaLabel="関数と Taylor 近似" />
      </div>
    </article>
  );
}
