import { useId, useState } from 'react';
import { MathJax } from 'better-react-mathjax';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { drawAxes, drawCurve, drawPoint, makePlotMap } from '../lib/plot';
import { taylorSteps, taylorSumAround, trigCompute, trueValue, type TrigFn } from '../lib/taylor';

// v1 source: examples.trig in docs/legacy/index.html
//   - heading: 'sin / cos / exp と Taylor 展開'
//   - select options 'sin x' / 'cos x' / 'e^x'
//   - buttons '+ 項を追加' (cap 8) / 'リセット' (back to terms=1) — NO subtract button
//   - display 'Taylor 次数: ${terms}'
//   - slider x: -3..3 step 0.01
export function Trig() {
  const selectId = useId();
  const [fn, setFn] = useState<TrigFn>('sin');
  const [terms, setTerms] = useState(1);
  const [x, setX] = useState(1);

  const { value, derivative } = trigCompute(fn, x);
  const steps = taylorSteps(fn, x);

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const yRange: [number, number] = fn === 'exp' ? [-1, 20] : [-2, 2];
    const m = makePlotMap({ xMin: -3, xMax: 3, yMin: yRange[0], yMax: yRange[1], w, h });
    drawAxes(ctx, m);
    drawCurve(ctx, m, (xx) => trueValue(fn, xx), { color: '#1a1a1a' });
    drawCurve(ctx, m, taylorSumAround(fn, x, terms), { color: '#6b4eff', width: 1.5 });
    drawPoint(ctx, m, x, value);
  };

  return (
    <article>
      <h2 className="font-[var(--font-ui)] mt-0">sin / cos / exp と Taylor 展開</h2>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-4 mt-2">
        <div>
          <div className="mb-3 font-[var(--font-ui)] text-sm">
            <label htmlFor={selectId}>関数: </label>
            <select
              id={selectId}
              value={fn}
              onChange={(e) => {
                setFn(e.target.value as TrigFn);
                setTerms(1);
              }}
              className="ml-2 border border-[var(--color-border)] rounded p-1"
            >
              <option value="sin">sin x</option>
              <option value="cos">cos x</option>
              <option value="exp">e^x</option>
            </select>
          </div>
          <div className="mt-4 space-y-1">
            {steps.map((s, i) => (
              <StepRow key={i} tex={s.latex} highlight={s.highlight} ghost={s.ghost} />
            ))}
          </div>
          <Slider
            label={<MathJax inline>{`\\(x\\)`}</MathJax>}
            value={x}
            min={-3}
            max={3}
            step={0.01}
            onChange={setX}
          />
          <div className="mt-3 font-[var(--font-ui)] text-sm flex items-center gap-2">
            <span>Taylor 次数: {terms}</span>{' '}
            <button
              onClick={() => setTerms((t) => (t < 8 ? t + 1 : t))}
              className="border border-[var(--color-border)] rounded px-2 py-1"
            >
              + 項を追加
            </button>{' '}
            <button
              onClick={() => setTerms(1)}
              className="border border-[var(--color-border)] rounded px-2 py-1"
            >
              リセット
            </button>
          </div>
          {/* readout for tests */}
          <div className="mt-2 text-sm text-[var(--color-ink-soft)]">
            <span data-testid="value">{value.toFixed(3)}</span>
            {' / '}
            <span data-testid="derivative">{derivative.toFixed(3)}</span>
          </div>
        </div>
        <Plot draw={draw} ariaLabel="関数と Taylor 近似" />
      </div>
    </article>
  );
}
