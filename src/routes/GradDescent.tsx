import { useState } from 'react';
import { StepRow } from '../components/StepRow';
import { Slider } from '../components/Slider';
import { Warn } from '../components/Warn';
import { fmt3 } from '../lib/format';
import { gradStep, isDiverged, type GradStepResult } from '../lib/grad';

export function GradDescent() {
  const [x0, setX0] = useState(5);
  const [eta, setEta] = useState(0.1);
  const [history, setHistory] = useState<GradStepResult[]>([]);

  const advance = () => {
    setHistory((h) => {
      const prev = h.length === 0 ? x0 : h[h.length - 1].x;
      return [...h, gradStep(prev, eta)];
    });
  };
  const reset = () => setHistory([]);

  const last = history[history.length - 1];
  const diverged = last ? isDiverged(last) : false;

  return (
    <article>
      <h2 className="font-[var(--font-ui)] mt-0">勾配降下</h2>
      <p>f(x) = (x − 2)² + 1 を勾配降下で最小化。η が大きすぎると発散します。</p>
      <Slider
        label="x₀"
        value={x0}
        min={-5}
        max={10}
        step={0.1}
        onChange={(v) => { setX0(v); setHistory([]); }}
      />
      <Slider
        label="η"
        value={eta}
        min={0}
        max={1.5}
        step={0.01}
        onChange={(v) => { setEta(v); setHistory([]); }}
      />
      <div className="flex gap-2 mt-3">
        <button onClick={advance} className="border border-[var(--color-border)] rounded px-3 py-1">
          次のステップ
        </button>
        <button onClick={reset} className="border border-[var(--color-border)] rounded px-3 py-1">
          リセット
        </button>
      </div>
      {diverged && <Warn>発散しました。η を小さくしてください。</Warn>}
      <div className="mt-4 space-y-1">
        {history.map((s, i) => (
          <div key={i}>
            <StepRow
              tex={`x_{${i}} = ${fmt3(s.prev)},\\; f = ${fmt3(s.fx)},\\; f' = ${fmt3(s.dfx)},\\; x_{${i + 1}} = ${fmt3(s.x)}`}
            />
          </div>
        ))}
      </div>
    </article>
  );
}
