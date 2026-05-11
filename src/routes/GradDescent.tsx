import { useState } from 'react';
import { MathJax } from 'better-react-mathjax';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { Warn } from '../components/Warn';
import { drawAxes, drawCurve, drawPoint, makePlotMap } from '../lib/plot';
import { gradF, gradStep, isGradDiverged, type HistRow } from '../lib/grad';
import { useThemeColors } from '../hooks/useThemeColors';

// v1 source: examples.gradDescent in docs/legacy/index.html
//   - heading: '勾配降下'
//   - description: f(x) = (x-2)^2 + 1 の最小点を ...
//   - slider 初期値 x_0: -5..9 step 0.01 (initial 5.0)
//   - slider 学習率 η: 0.01..1.2 step 0.01 (initial 0.1)
//   - buttons '1 ステップ' / '10 ステップ' / 'リセット'
//   - history starts with {x: x0, fx: f(x0)}
//   - last 8 rows shown, format '\text{step } i:\; x = ...,\; f(x) = ...'
//   - warning '⚠ 発散しました。学習率 η を小さくしてください。'

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

  // v1 only displays the last 8 rows (preserving the global step index).
  const recent = history.slice(-8);
  const offset = history.length - recent.length;

  const colors = useThemeColors();

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
    <article>
      <h2 className="mt-0">勾配降下</h2>
      <p>
        <MathJax inline>{`\\(f(x) = (x-2)^2 + 1\\)`}</MathJax> の最小点を{' '}
        <MathJax inline>{`\\(x_{n+1} = x_n - \\eta f'(x_n)\\)`}</MathJax> で探します。
        <MathJax inline>{`\\(f'\\)`}</MathJax> は二重数で自動計算。
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-4">
        <div>
          <Slider
            label={<>初期値 <MathJax inline>{`\\(x_0\\)`}</MathJax></>}
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
            label={<>学習率 <MathJax inline>{`\\(\\eta\\)`}</MathJax></>}
            value={eta}
            min={0.01}
            max={1.2}
            step={0.01}
            onChange={(v) => setEta(v)}
          />
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={doStep}
              disabled={diverged}
              className="[font-family:var(--font-ui)] border border-[var(--color-border)] rounded px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              1 ステップ
            </button>
            <button
              onClick={doTen}
              disabled={diverged}
              className="[font-family:var(--font-ui)] border border-[var(--color-border)] rounded px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              10 ステップ
            </button>
            <button onClick={reset} className="[font-family:var(--font-ui)] border border-[var(--color-border)] rounded px-3 py-1.5">
              リセット
            </button>
          </div>
          {diverged && (
            <Warn>
              {/* v1 uses plain-text `η` (no MathJax) inside .warn — match verbatim. */}
              ⚠ 発散しました。学習率 η を小さくしてください。
            </Warn>
          )}
          <div className="mt-4 space-y-1">
            {recent.map((r, i) => {
              const idx = offset + i;
              const tex = `\\text{step } ${idx}:\\; x = ${r.x.toFixed(4)},\\; f(x) = ${r.fx.toFixed(4)}`;
              return (
                <div key={idx} data-testid="grad-step">
                  <StepRow tex={tex} />
                </div>
              );
            })}
          </div>
        </div>
        <Plot draw={draw} ariaLabel="勾配降下の軌跡" />
      </div>
    </article>
  );
}
