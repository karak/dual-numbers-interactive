import { useState } from 'react';
import { MathJax } from 'better-react-mathjax';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { Warn } from '../components/Warn';
import { drawAxes, drawCurve, drawPoint, drawTangent, makePlotMap } from '../lib/plot';
import { isNewWarningTriggered, newtonStep } from '../lib/newton';
import { useThemeColors } from '../hooks/useThemeColors';

// v1 source: examples.newton in docs/legacy/index.html
//   - heading: 'Newton 法'
//   - description: f(x) = x^3 - 2x - 5 ...
//   - slider: '初期値 x_0' (-3..3 step 0.01)
//   - buttons: '1 ステップ' / '5 ステップ' / 'リセット'
//   - history starts with one row {x: x0, fx: f(x0), dfx: NaN}
//   - history row format: '\text{step } i:\; x = ...,\; f(x) = ...,\; f'(x) = ...'
//   - warning when last finite |f'(x)| < 1e-6:
//     '⚠ f'(x) が 0 に近い：発散の恐れ。初期値を変えてみてください。'
const polyFn = (x: number): number => x * x * x - 2 * x - 5;

interface HistoryRow {
  x: number;
  fx: number;
  dfx: number; // NaN until a step is taken from this row
}

const initialHistory = (x0: number): HistoryRow[] => [
  { x: x0, fx: polyFn(x0), dfx: NaN },
];

interface NewtonProps {
  // Optional seed for tests: lets a test inject a history whose final-finite
  // dfx is near zero to exercise the (otherwise unreachable in -3..3) warning
  // branch deterministically. Production usage passes nothing.
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
      updated.push({ x: next.x, fx: polyFn(next.x), dfx: NaN });
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
        out.push({ x: next.x, fx: polyFn(next.x), dfx: NaN });
      }
      return out;
    });
  };
  const reset = () => setHistory(initialHistory(x0));

  // Deviation from v1: scan history for the most recent finite dfx instead
  // of trusting the just-pushed (NaN-dfx) row. See `isNewWarningTriggered`.
  const showWarn = isNewWarningTriggered(history);
  const colors = useThemeColors();

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const m = makePlotMap({ xMin: -3, xMax: 3, yMin: -10, yMax: 10, w, h });
    drawAxes(ctx, m, colors.border);
    drawCurve(ctx, m, polyFn, { color: colors.curve });
    history.forEach((row, i) => {
      ctx.globalAlpha = i === history.length - 1 ? 1 : 0.3;
      if (Number.isFinite(row.dfx)) drawTangent(ctx, m, row.x, row.fx, row.dfx, colors.tangent);
      drawPoint(ctx, m, row.x, row.fx, colors.tangent);
      ctx.globalAlpha = 1;
    });
  };

  return (
    <article>
      <h2 className="font-[var(--font-ui)] mt-0">Newton 法</h2>
      <p>
        <MathJax inline>{`\\(f(x) = x^3 - 2x - 5\\)`}</MathJax> の根を{' '}
        <MathJax inline>{`\\(x_{n+1} = x_n - f(x_n)/f'(x_n)\\)`}</MathJax> で求めます。
        <MathJax inline>{`\\(f'\\)`}</MathJax> は二重数で自動計算。
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-4">
        <div>
          <Slider
            label={<>初期値 <MathJax inline>{`\\(x_0\\)`}</MathJax></>}
            value={x0}
            min={-3}
            max={3}
            step={0.01}
            onChange={(v) => {
              setX0(v);
              setHistory(initialHistory(v));
            }}
          />
          <div className="flex gap-2 mt-3">
            <button onClick={doStep} className="border border-[var(--color-border)] rounded px-3 py-1">
              1 ステップ
            </button>
            <button onClick={doFive} className="border border-[var(--color-border)] rounded px-3 py-1">
              5 ステップ
            </button>
            <button onClick={reset} className="border border-[var(--color-border)] rounded px-3 py-1">
              リセット
            </button>
          </div>
          {showWarn && (
            <Warn>
              {/* v1 uses plain-text `f'(x)` (no MathJax) inside .warn — match verbatim. */}
              ⚠ f'(x) が 0 に近い：発散の恐れ。初期値を変えてみてください。
            </Warn>
          )}
          <div className="mt-4 space-y-1">
            {history.map((r, i) => {
              const tail = Number.isFinite(r.dfx)
                ? `,\\; f'(x) = ${r.dfx.toFixed(6)}`
                : '';
              const tex = `\\text{step } ${i}:\\; x = ${r.x.toFixed(6)},\\; f(x) = ${r.fx.toFixed(6)}${tail}`;
              return (
                <div key={i} data-testid="newton-step">
                  <StepRow tex={tex} />
                </div>
              );
            })}
          </div>
        </div>
        <Plot draw={draw} ariaLabel="Newton 法の反復" />
      </div>
    </article>
  );
}
