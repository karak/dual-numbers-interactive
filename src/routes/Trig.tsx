import { useId, useState } from 'react';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { drawAxes, drawCurve, drawPoint, makePlotMap } from '../lib/plot';
import { taylorSteps, taylorSumAround, trigCompute, trueValue, type TrigFn } from '../lib/taylor';
import { useThemeColors } from '../hooks/useThemeColors';
import { useMathJaxTypeset } from '../hooks/useMathJaxTypeset';

/*
 * 1:1 port of examples.trig in docs/legacy/index.html:L414-500.
 *
 * v1 DOM after render(main, state):
 *
 *   <h2>sin / cos / exp と Taylor 展開</h2>
 *   <div class="panel">
 *     <div>                                              <- left col
 *       <div style="margin-bottom:12px">                 <- select container
 *         <label for="trig-fn-N">関数: </label>
 *         <select id="trig-fn-N">
 *           <option value="sin">sin x</option>
 *           <option value="cos">cos x</option>
 *           <option value="exp">e^x</option>
 *         </select>
 *       </div>
 *       <div>                                            <- stepsEl
 *         <div class="step-row">$$...$$</div> ×4
 *       </div>
 *       <div style="margin-top:16px">                    <- x slider
 *         <label for="slider-N">$x$ = <span>1.00</span></label>
 *         <input type="range" min="-3" max="3" step="0.01" value="1">
 *       </div>
 *       <div style="margin-top:12px">                    <- Taylor controls
 *         <label>Taylor 次数: <span>1</span></label> <button>+ 項を追加</button> <button>リセット</button>
 *       </div>
 *     </div>
 *     <div><canvas></canvas></div>                       <- right col
 *   </div>
 */
export function Trig() {
  const selectId = useId();
  const [fn, setFn] = useState<TrigFn>('sin');
  const [terms, setTerms] = useState(1);
  const [x, setX] = useState(1);

  const { value } = trigCompute(fn, x);
  const steps = taylorSteps(fn, x);
  const colors = useThemeColors();
  useMathJaxTypeset([fn, terms, x]);

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const yRange: [number, number] = fn === 'exp' ? [-1, 20] : [-2, 2];
    const m = makePlotMap({ xMin: -3, xMax: 3, yMin: yRange[0], yMax: yRange[1], w, h });
    drawAxes(ctx, m, colors.border);
    drawCurve(ctx, m, (xx) => trueValue(fn, xx), { color: colors.curve });
    drawCurve(ctx, m, taylorSumAround(fn, x, terms), { color: colors.tangent, width: 1.5 });
    drawPoint(ctx, m, x, value, colors.tangent);
  };

  return (
    <>
      <h2>{'sin / cos / exp と Taylor 展開'}</h2>
      <div className="panel">
        <div>
          <div style={{ marginBottom: '12px' }}>
            <label htmlFor={selectId}>{'関数: '}</label>
            <select
              id={selectId}
              value={fn}
              onChange={(e) => {
                setFn(e.target.value as TrigFn);
                setTerms(1);
              }}
            >
              <option value="sin">{'sin x'}</option>
              <option value="cos">{'cos x'}</option>
              <option value="exp">{'e^x'}</option>
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
            min={-3}
            max={3}
            step={0.01}
            onChange={setX}
          />
          <div style={{ marginTop: '12px' }}>
            <label>{'Taylor 次数: '}<span>{terms}</span></label>{' '}
            <button onClick={() => setTerms((t) => (t < 8 ? t + 1 : t))}>{'+ 項を追加'}</button>{' '}
            <button onClick={() => setTerms(1)}>{'リセット'}</button>
          </div>
        </div>
        <Plot draw={draw} />
      </div>
    </>
  );
}
