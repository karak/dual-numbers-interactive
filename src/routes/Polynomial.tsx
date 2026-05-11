import { useState } from 'react';
import { MathJax } from 'better-react-mathjax';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { drawAxes, drawCurve, drawPoint, drawTangent, makePlotMap } from '../lib/plot';
import { polyCompute, polyF, polySteps } from '../lib/poly';
import { useThemeColors } from '../hooks/useThemeColors';

// v1 source: examples.poly in docs/legacy/index.html
//   - heading: '多項式の自動微分'
//   - description paragraph
//   - 5-line derivation steps (highlight on row 4)
//   - slider x: -3..3 step 0.01
export function Polynomial() {
  const [x, setX] = useState(1);
  const { value, derivative } = polyCompute(x);
  const steps = polySteps(x);
  const colors = useThemeColors();

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const m = makePlotMap({ xMin: -3, xMax: 3, yMin: -10, yMax: 10, w, h });
    drawAxes(ctx, m, colors.border);
    drawCurve(ctx, m, polyF, { color: colors.curve });
    drawTangent(ctx, m, x, value, derivative, colors.tangent);
    drawPoint(ctx, m, x, value, colors.tangent);
  };

  return (
    <article>
      <h2 className="mt-0">多項式の自動微分</h2>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-4">
        <div>
          <p>
            <MathJax inline>{`\\(f(x) = x^3 - 2x^2 + x - 1\\)`}</MathJax>{' '}
            を二重数で評価すると、実部に <MathJax inline>{`\\(f(x)\\)`}</MathJax>、
            <MathJax inline>{`\\(\\varepsilon\\)`}</MathJax> 部に{' '}
            <MathJax inline>{`\\(f'(x)\\)`}</MathJax> が同時に出ます。
          </p>
          <div>
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
        </div>
        <Plot draw={draw} ariaLabel="f(x) と接線" />
      </div>
    </article>
  );
}
