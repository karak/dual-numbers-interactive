import { useState } from 'react';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { Warn } from '../components/Warn';
import { drawAxes, drawCurve, drawPoint, makePlotMap } from '../lib/plot';
import { gradF, gradStep, isGradDiverged, type HistRow } from '../lib/grad';
import { useThemeColors } from '../hooks/useThemeColors';
import { useMathJaxTypeset } from '../hooks/useMathJaxTypeset';

/*
 * 1:1 port of examples.gradDescent in docs/legacy/index.html:L662-746.
 *
 * v1 DOM after render(main, state):
 *
 *   <h2>勾配降下</h2>
 *   <p>$f(x) = (x-2)^2 + 1$ の最小点を $x_{n+1} = x_n - \eta f'(x_n)$ で探します。$f'$ は二重数で自動計算。</p>
 *   <div class="panel">
 *     <div>                                          <- left col
 *       <div style="margin-top:16px">                <- x0 slider container
 *         <label for="slider-N">初期値 $x_0$ = <span>5.00</span></label>
 *         <input type="range" min="-5" max="9" step="0.01" value="5">
 *       </div>
 *       <div style="margin-top:16px">                <- η slider container
 *         <label for="slider-M">学習率 $\eta$ = <span>0.10</span></label>
 *         <input type="range" min="0.01" max="1.2" step="0.01" value="0.1">
 *       </div>
 *       <div style="margin-top:12px">                <- button row
 *         <button>1 ステップ</button> <button>10 ステップ</button> <button>リセット</button>
 *       </div>
 *       <div class="warn"></div>                     <- warn (textContent toggled)
 *       <div>                                        <- stepsEl (last 8 only, offset preserved)
 *         <div class="step-row">$$\text{step } i:\; ...$$</div> ×≤8
 *       </div>
 *     </div>
 *     <div><canvas></canvas></div>
 *   </div>
 *
 * v1 keeps stepping past divergence; the warn is only a display. We preserve
 * that behaviour (no `disabled` prop on the buttons) — the previous v2 added
 * disabled-after-divergence which was not in v1.
 */
const initialHistory = (x0: number): HistRow[] => [{ x: x0, fx: gradF(x0) }];

export function GradDescent() {
  const [x0, setX0] = useState(5);
  const [eta, setEta] = useState(0.1);
  const [history, setHistory] = useState<HistRow[]>(() => initialHistory(5));

  const doStep = () => {
    setHistory((h) => {
      const last = h[h.length - 1];
      const r = gradStep(last.x, eta);
      return [...h, { x: r.x, fx: gradF(r.x) }];
    });
  };
  const doTen = () => {
    setHistory((h) => {
      const out: HistRow[] = [...h];
      for (let i = 0; i < 10; i++) {
        const last = out[out.length - 1];
        const r = gradStep(last.x, eta);
        out.push({ x: r.x, fx: gradF(r.x) });
      }
      return out;
    });
  };
  const reset = () => setHistory(initialHistory(x0));

  const diverged = isGradDiverged(history);
  const recent = history.slice(-8);
  const offset = history.length - recent.length;

  const colors = useThemeColors();
  useMathJaxTypeset([x0, eta, history]);

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const m = makePlotMap({ xMin: -5, xMax: 9, yMin: 0, yMax: 50, w, h });
    drawAxes(ctx, m, colors.border);
    drawCurve(ctx, m, gradF, { color: colors.curve });
    ctx.save();
    ctx.strokeStyle = colors.tangent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    history.forEach((p, i) => {
      const px = m.toX(p.x);
      const py = m.toY(p.fx);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();
    ctx.restore();
    history.forEach((p) => drawPoint(ctx, m, p.x, p.fx, colors.tangent));
  };

  return (
    <>
      <h2>{'勾配降下'}</h2>
      <p>{"$f(x) = (x-2)^2 + 1$ の最小点を $x_{n+1} = x_n - \\eta f'(x_n)$ で探します。$f'$ は二重数で自動計算。"}</p>
      <div className="panel">
        <div>
          <Slider
            label="初期値 $x_0$"
            value={x0}
            min={-5}
            max={9}
            step={0.01}
            onChange={(v) => {
              setX0(v);
              setHistory(initialHistory(v));
            }}
          />
          <Slider
            label="学習率 $\eta$"
            value={eta}
            min={0.01}
            max={1.2}
            step={0.01}
            onChange={(v) => setEta(v)}
          />
          <div style={{ marginTop: '12px' }}>
            <button onClick={doStep}>{'1 ステップ'}</button>{' '}
            <button onClick={doTen}>{'10 ステップ'}</button>{' '}
            <button onClick={reset}>{'リセット'}</button>
          </div>
          <Warn>{diverged ? '⚠ 発散しました。学習率 η を小さくしてください。' : null}</Warn>
          <div>
            {recent.map((r, i) => {
              const idx = offset + i;
              const tex = `\\text{step } ${idx}:\\; x = ${r.x.toFixed(4)},\\; f(x) = ${r.fx.toFixed(4)}`;
              return <StepRow key={idx} tex={tex} />;
            })}
          </div>
        </div>
        <Plot draw={draw} />
      </div>
    </>
  );
}
