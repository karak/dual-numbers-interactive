import { useState } from 'react';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { drawAxes, drawCurve, drawPoint, drawTangent, makePlotMap } from '../lib/plot';
import { polyCompute, polyF, polySteps } from '../lib/poly';
import { useThemeColors } from '../hooks/useThemeColors';
import { useMathJaxTypeset } from '../hooks/useMathJaxTypeset';

/*
 * 1:1 port of examples.poly in docs/legacy/index.html:L359-409.
 *
 * v1 DOM after render(main, state):
 *
 *   <h2>多項式の自動微分</h2>
 *   <div class="panel">
 *     <div>                                         <- left column
 *       <p>$f(x) = x^3 - 2x^2 + x - 1$ を二重数で
 *          評価すると、実部に $f(x)$、$\varepsilon$
 *          部に $f'(x)$ が同時に出ます。</p>
 *       <div>                                       <- stepsEl
 *         <div class="step-row">$$...$$</div> ×5
 *       </div>
 *       <div style="margin-top:16px">               <- slider container
 *         <label for="slider-N">$x$ = <span>1.00</span></label>
 *         <input type="range" ...>
 *       </div>
 *     </div>
 *     <div><canvas></canvas></div>                  <- right column
 *   </div>
 *
 * v1 calls typeset(container) at L393 after replaceChildren and again at
 * L398 inside renderSteps() after each slider input event. The
 * useMathJaxTypeset([x]) hook below fires after every React commit caused
 * by x changes, which corresponds to v1's typeset call on slider input.
 */
export function Polynomial() {
  const [x, setX] = useState(1);
  const { value, derivative } = polyCompute(x);
  const steps = polySteps(x);
  const colors = useThemeColors();
  useMathJaxTypeset([x]);

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const m = makePlotMap({ xMin: -3, xMax: 3, yMin: -10, yMax: 10, w, h });
    drawAxes(ctx, m, colors.border);
    drawCurve(ctx, m, polyF, { color: colors.curve });
    drawTangent(ctx, m, x, value, derivative, colors.tangent);
    drawPoint(ctx, m, x, value, colors.tangent);
  };

  return (
    <>
      <h2>{'多項式の自動微分'}</h2>
      <div className="panel">
        <div>
          <p>{"$f(x) = x^3 - 2x^2 + x - 1$ を二重数で評価すると、実部に $f(x)$、$\\varepsilon$ 部に $f'(x)$ が同時に出ます。"}</p>
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
        </div>
        <Plot draw={draw} />
      </div>
    </>
  );
}
