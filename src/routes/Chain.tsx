import { useId, useState } from 'react';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { drawAxes, drawCurve, drawPoint, drawTangent, makePlotMap } from '../lib/plot';
import { chainCompute, chainFn, chainSteps, type Inner, type Outer } from '../lib/chain';
import { useThemeColors } from '../hooks/useThemeColors';
import { useMathJaxTypeset } from '../hooks/useMathJaxTypeset';

/*
 * 1:1 port of examples.chain in docs/legacy/index.html:L502-582.
 *
 * v1 select-container line (L555-557):
 *
 *   h('div', { style: { marginBottom: '12px' } },
 *     h('label', { for: innerId }, '内側 g(x): '), innerSel, ' ',
 *     h('label', { for: outerId, style: { marginLeft: '12px' } }, '外側 f(u): '), outerSel)
 *
 * — both labels are plain text (no $...$); the outer label has an explicit
 * marginLeft:12px so the two select pairs sit at a consistent horizontal
 * spacing regardless of the first select's rendered width.
 */
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
  useMathJaxTypeset([inner, outer, x]);

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const yRange: [number, number] = outer === 'exp' ? [-1, 20] : [-2, 2];
    const m = makePlotMap({ xMin: -2, xMax: 2, yMin: yRange[0], yMax: yRange[1], w, h });
    drawAxes(ctx, m, colors.border);
    drawCurve(ctx, m, fn, { color: colors.curve });
    drawTangent(ctx, m, x, r.value, r.derivative, colors.tangent);
    drawPoint(ctx, m, x, r.value, colors.tangent);
  };

  return (
    <>
      <h2>{'連鎖律'}</h2>
      <div className="panel">
        <div>
          <div style={{ marginBottom: '12px' }}>
            <label htmlFor={innerId}>{'内側 g(x): '}</label>
            <select
              id={innerId}
              value={inner}
              onChange={(e) => setInner(e.target.value as Inner)}
            >
              <option value="sq">{'x²'}</option>
              <option value="cube">{'x³'}</option>
              <option value="twox">{'2x'}</option>
            </select>{' '}
            <label htmlFor={outerId} style={{ marginLeft: '12px' }}>{'外側 f(u): '}</label>
            <select
              id={outerId}
              value={outer}
              onChange={(e) => setOuter(e.target.value as Outer)}
            >
              <option value="sin">{'sin u'}</option>
              <option value="cos">{'cos u'}</option>
              <option value="exp">{'e^u'}</option>
            </select>
          </div>
          <div>
            {steps.map((s, i) => (
              <StepRow key={i} tex={s.latex} highlight={s.highlight} ghost={s.ghost} />
            ))}
          </div>
          <Slider
            label="$x$"
            value={x}
            min={-2}
            max={2}
            step={0.01}
            onChange={setX}
          />
        </div>
        <Plot draw={draw} />
      </div>
    </>
  );
}
