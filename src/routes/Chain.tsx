import { useId, useState } from 'react';
import { MathJax } from 'better-react-mathjax';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { drawAxes, drawCurve, drawPoint, drawTangent, makePlotMap } from '../lib/plot';
import { chainCompute, chainFn, chainSteps, type Inner, type Outer } from '../lib/chain';
import { useThemeColors } from '../hooks/useThemeColors';

// v1 source: examples.chain in docs/legacy/index.html
//   - heading: '連鎖律'
//   - inner select: 'x²' / 'x³' / '2x'  (keys sq / cube / twox — NOT sin)
//   - outer select: 'sin u' / 'cos u' / 'e^u'
//   - labels: '内側 g(x):' '外側 f(u):'
//   - slider x: -2..2 step 0.01
export function Chain() {
  const innerId = useId();
  const outerId = useId();
  const [inner, setInner] = useState<Inner>('sq');
  const [outer, setOuter] = useState<Outer>('sin');
  const [x, setX] = useState(1);
  const r = chainCompute(x, inner, outer);
  const steps = chainSteps(x, inner, outer);
  const fn = chainFn(inner, outer);
  const colors = useThemeColors();

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const yRange: [number, number] = outer === 'exp' ? [-1, 20] : [-2, 2];
    const m = makePlotMap({ xMin: -2, xMax: 2, yMin: yRange[0], yMax: yRange[1], w, h });
    drawAxes(ctx, m, colors.border);
    drawCurve(ctx, m, fn, { color: colors.curve });
    drawTangent(ctx, m, x, r.value, r.derivative, colors.tangent);
    drawPoint(ctx, m, x, r.value, colors.tangent);
  };

  return (
    <article>
      <h2 className="mt-0">連鎖律</h2>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-4 mt-2">
        <div>
          <div className="mb-3 text-sm">
            <label htmlFor={innerId}>内側 g(x): </label>
            <select
              id={innerId}
              value={inner}
              onChange={(e) => setInner(e.target.value as Inner)}
              className="border border-[var(--color-border)] rounded p-1"
            >
              <option value="sq">x²</option>
              <option value="cube">x³</option>
              <option value="twox">2x</option>
            </select>{' '}
            <label htmlFor={outerId} className="ml-3">外側 f(u): </label>
            <select
              id={outerId}
              value={outer}
              onChange={(e) => setOuter(e.target.value as Outer)}
              className="border border-[var(--color-border)] rounded p-1"
            >
              <option value="sin">sin u</option>
              <option value="cos">cos u</option>
              <option value="exp">e^u</option>
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
            min={-2}
            max={2}
            step={0.01}
            onChange={setX}
          />
        </div>
        <Plot draw={draw} ariaLabel="合成関数" />
      </div>
    </article>
  );
}
