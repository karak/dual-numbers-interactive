import { useState } from 'react';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { Warn } from '../components/Warn';
import { drawAxes, drawCurve, drawPoint, drawTangent, makePlotMap } from '../lib/plot';
import { isNewWarningTriggered, newtonF, newtonStep } from '../lib/newton';
import { useThemeColors } from '../hooks/useThemeColors';
import { useMathJaxTypeset } from '../hooks/useMathJaxTypeset';

/*
 * 1:1 port of examples.newton in docs/legacy/index.html:L584-661.
 *
 * v1 DOM after render(main, state):
 *
 *   <h2>Newton 法</h2>
 *   <p>$f(x) = x^3 - 2x - 5$ の根を $x_{n+1} = ...$ で求めます。$f'$ は二重数で自動計算。</p>
 *   <div class="panel">
 *     <div>                                          <- left col
 *       <div style="margin-top:16px">                <- x0 slider
 *         <label for="slider-N">初期値 $x_0$ = <span>2.00</span></label>
 *         <input type="range" min="-3" max="3" step="0.01" value="2">
 *       </div>
 *       <div style="margin-top:12px">                <- button row
 *         <button>1 ステップ</button> <button>5 ステップ</button> <button>リセット</button>
 *       </div>
 *       <div class="warn"></div>                     <- warn (textContent toggled)
 *       <div>                                        <- stepsEl
 *         <div class="step-row">$$\text{step } i:\; ...$$</div> ×N
 *       </div>
 *     </div>
 *     <div><canvas></canvas></div>
 *   </div>
 */
interface HistoryRow {
  x: number;
  fx: number;
  dfx: number;
}

const initialHistory = (x0: number): HistoryRow[] => [
  { x: x0, fx: newtonF(x0), dfx: NaN },
];

interface NewtonProps {
  initialHistory?: ReadonlyArray<HistoryRow>;
}

export function Newton({ initialHistory: seed }: NewtonProps = {}) {
  const [x0, setX0] = useState(2);
  const [history, setHistory] = useState<HistoryRow[]>(() =>
    seed ? [...seed] : initialHistory(2),
  );

  const doStep = () => {
    setHistory((h) => {
      const last = h[h.length - 1];
      const next = newtonStep(last.x);
      const updated: HistoryRow[] = h.map((row, i) =>
        i === h.length - 1 ? { ...row, dfx: next.dfx } : row,
      );
      updated.push({ x: next.x, fx: newtonF(next.x), dfx: NaN });
      return updated;
    });
  };
  const doFive = () => {
    setHistory((h) => {
      const out: HistoryRow[] = [...h];
      for (let i = 0; i < 5; i++) {
        const last = out[out.length - 1];
        const next = newtonStep(last.x);
        out[out.length - 1] = { ...last, dfx: next.dfx };
        out.push({ x: next.x, fx: newtonF(next.x), dfx: NaN });
      }
      return out;
    });
  };
  const reset = () => setHistory(initialHistory(x0));

  const showWarn = isNewWarningTriggered(history);
  const colors = useThemeColors();
  useMathJaxTypeset([x0, history]);

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const m = makePlotMap({ xMin: -3, xMax: 3, yMin: -10, yMax: 10, w, h });
    drawAxes(ctx, m, colors.border);
    drawCurve(ctx, m, newtonF, { color: colors.curve });
    history.forEach((row, i) => {
      ctx.globalAlpha = i === history.length - 1 ? 1 : 0.3;
      if (Number.isFinite(row.dfx)) drawTangent(ctx, m, row.x, row.fx, row.dfx, colors.tangent);
      drawPoint(ctx, m, row.x, row.fx, colors.tangent);
      ctx.globalAlpha = 1;
    });
  };

  return (
    <>
      <h2>{'Newton 法'}</h2>
      <p>{"$f(x) = x^3 - 2x - 5$ の根を $x_{n+1} = x_n - f(x_n)/f'(x_n)$ で求めます。$f'$ は二重数で自動計算。"}</p>
      <div className="panel">
        <div>
          <Slider
            label="初期値 $x_0$"
            value={x0}
            min={-3}
            max={3}
            step={0.01}
            onChange={(v) => {
              setX0(v);
              setHistory(initialHistory(v));
            }}
          />
          <div style={{ marginTop: '12px' }}>
            <button onClick={doStep}>{'1 ステップ'}</button>{' '}
            <button onClick={doFive}>{'5 ステップ'}</button>{' '}
            <button onClick={reset}>{'リセット'}</button>
          </div>
          <Warn>{showWarn ? "⚠ f'(x) が 0 に近い：発散の恐れ。初期値を変えてみてください。" : null}</Warn>
          <div>
            {history.map((r, i) => {
              const tail = Number.isFinite(r.dfx) ? `,\\; f'(x) = ${r.dfx.toFixed(6)}` : '';
              const tex = `\\text{step } ${i}:\\; x = ${r.x.toFixed(6)},\\; f(x) = ${r.fx.toFixed(6)}${tail}`;
              return <StepRow key={i} tex={tex} />;
            })}
          </div>
        </div>
        <Plot draw={draw} />
      </div>
    </>
  );
}
