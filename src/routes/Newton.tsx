import { useState } from 'react';
import { StepRow } from '../components/StepRow';
import { Slider } from '../components/Slider';
import { fmt3 } from '../lib/format';
import { newtonStep, type NewtonStep as Step } from '../lib/newton';

export function Newton() {
  const [x0, setX0] = useState(2);
  const [steps, setSteps] = useState<Step[]>([]);

  const current = steps.length > 0 ? steps[steps.length - 1].x : x0;

  const advance = () => {
    setSteps((s) => [...s, newtonStep(s.length === 0 ? x0 : s[s.length - 1].x)]);
  };
  const reset = () => setSteps([]);
  const converge = () => {
    const s: Step[] = [];
    let xc = x0;
    for (let i = 0; i < 20; i++) {
      const step = newtonStep(xc);
      s.push(step);
      if (Math.abs(step.fx) < 1e-9) break;
      xc = step.x;
    }
    setSteps(s);
  };

  return (
    <article>
      <h2 className="font-[var(--font-ui)] mt-0">Newton 法</h2>
      <p>
        f(x) = x³ - 2x - 5 の根を Newton 法で求めます。微分は二重数で自動計算。
      </p>
      <Slider
        label="x₀"
        value={x0}
        min={-3}
        max={3}
        step={0.1}
        onChange={(v) => {
          setX0(v);
          setSteps([]);
        }}
      />
      <div className="flex gap-2 mt-3">
        <button onClick={advance} className="border border-[var(--color-border)] rounded px-3 py-1">
          次のステップ
        </button>
        <button onClick={converge} className="border border-[var(--color-border)] rounded px-3 py-1">
          収束まで
        </button>
        <button onClick={reset} className="border border-[var(--color-border)] rounded px-3 py-1">
          リセット
        </button>
      </div>
      <div className="mt-4 space-y-1">
        <StepRow tex={`x_{\\text{current}} = ${fmt3(current)}`} ghost />
        {steps.map((s, i) => (
          <div key={i} data-testid="newton-step">
            <StepRow
              tex={`x_{${i}} = ${fmt3(s.prev)},\\quad f = ${fmt3(s.fx)},\\quad f' = ${fmt3(s.dfx)},\\quad x_{${i + 1}} = ${fmt3(s.x)}`}
            />
          </div>
        ))}
      </div>
    </article>
  );
}
