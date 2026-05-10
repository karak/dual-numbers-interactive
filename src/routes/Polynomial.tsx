import { useState } from 'react';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { drawAxes, drawCurve, drawPoint, drawTangent, makePlotMap } from '../lib/plot';
import { fmt3 } from '../lib/format';
import { polyCompute, polyF } from '../lib/poly';

export function Polynomial() {
  const [x, setX] = useState(1);
  const { value, derivative } = polyCompute(x);

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const cs = getComputedStyle(document.documentElement);
    const border = cs.getPropertyValue('--color-border').trim() || '#e8e6e0';
    const curve = cs.getPropertyValue('--color-curve').trim() || '#1a1a1a';
    const m = makePlotMap({ xMin: -3, xMax: 3, yMin: -10, yMax: 10, w, h });
    drawAxes(ctx, m, border);
    drawCurve(ctx, m, polyF, { color: curve });
    drawTangent(ctx, m, x, value, derivative);
    drawPoint(ctx, m, x, value);
  };

  return (
    <article>
      <h2 className="font-[var(--font-ui)] mt-0">多項式</h2>
      <p>
        f(x) = x³ - 2x² + x - 1 を二重数で計算し、関数値と微分を同時に得ます。
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-4">
        <div>
          <Slider label="x" value={x} min={-3} max={3} step={0.05} onChange={setX} />
          <div className="mt-4 space-y-1">
            <StepRow tex={`x = ${fmt3(x)}`} />
            <StepRow tex={`f(x) = ${fmt3(value)}`} highlight />
            <StepRow tex={`f'(x) = ${fmt3(derivative)}`} highlight />
          </div>
          <div className="mt-2 text-sm text-[var(--color-ink-soft)]">
            <span data-testid="value">{fmt3(value)}</span>
            {' / '}
            <span data-testid="derivative">{fmt3(derivative)}</span>
          </div>
        </div>
        <Plot draw={draw} ariaLabel="f(x) と接線" />
      </div>
    </article>
  );
}
