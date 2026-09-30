import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import { GradDescent } from '../../src/routes/GradDescent';

function renderGD() {
  return render(
    <MathJaxContext version={3}>
      <MemoryRouter>
        <GradDescent />
      </MemoryRouter>
    </MathJaxContext>,
  );
}

describe('GradDescent route', () => {
  it('shows the v1 heading "勾配降下"', () => {
    renderGD();
    expect(
      screen.getByRole('heading', { level: 2, name: '勾配降下' }),
    ).toBeInTheDocument();
  });

  it('shows the v1 description featuring (x-2)^2 + 1', () => {
    const { container } = renderGD();
    expect(container.textContent).toContain('(x-2)^2 + 1');
  });

  it('exposes "1 ステップ", "10 ステップ", "リセット" buttons (v1 set)', () => {
    renderGD();
    expect(screen.getByRole('button', { name: '1 ステップ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10 ステップ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'リセット' })).toBeInTheDocument();
  });

  it('shows divergence warning when eta is large and steps run', () => {
    renderGD();
    // Two sliders exist; the second is the learning-rate η slider (matches v1 layout).
    const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
    const etaSlider = sliders[1];
    fireEvent.change(etaSlider, { target: { value: '1.2' } });
    const stepBtn = screen.getByRole('button', { name: '1 ステップ' });
    // With eta=1.2, x0=5, |x-2| grows 1.4×/step; reaching |x|>1e6 needs ~38 steps.
    for (let i = 0; i < 40; i++) fireEvent.click(stepBtn);
    // v1 (docs/legacy/index.html:L603) uses <div class="warn">, not role=alert.
    const warn = document.querySelector('.warn')!;
    expect(warn).not.toBeNull();
    expect(warn.textContent).toContain('発散しました。学習率');
    expect(warn.textContent).toContain('小さくしてください');
    expect(warn.textContent).toContain('⚠');
    expect(warn.textContent).toContain('η');
  });

  it('shows the v1 description fragment "の最小点を"', () => {
    const { container } = renderGD();
    expect(container.textContent).toContain('の最小点を');
  });

  it('renders the v1 verbatim slider-label prefixes "初期値" and "学習率"', () => {
    const { container } = renderGD();
    expect(container.textContent).toContain('初期値');
    expect(container.textContent).toContain('学習率');
  });

  it('exposes exactly two sliders (x_0 + η)', () => {
    renderGD();
    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });

  // Divergence-disable tests removed: v1 (docs/legacy/index.html:L724-728)
  // keeps stepping past divergence and only toggles the warn textContent.
  // The v2-only `disabled` prop was dropped during the v1-faithful rewrite.
  //
  // Subagent review I5 (.claude/plans/rustling-swinging-crescent.md): a
  // future re-introduction of `disabled={diverged}` would silently pass
  // component tests without this negative assertion.
  it('step buttons never carry a disabled attribute (v1 fidelity, L724-728)', () => {
    renderGD();
    for (const btn of screen.getAllByRole('button')) {
      expect(btn).not.toHaveAttribute('disabled');
    }
    // After divergence, still no disabled attribute.
    const sliders = screen.getAllByRole('slider') as HTMLInputElement[];
    const etaSlider = sliders[1];
    fireEvent.change(etaSlider, { target: { value: '1.2' } });
    const stepBtn = screen.getByRole('button', { name: '1 ステップ' });
    for (let i = 0; i < 40; i++) fireEvent.click(stepBtn);
    for (const btn of screen.getAllByRole('button')) {
      expect(btn).not.toHaveAttribute('disabled');
    }
  });

  it('"10 ステップ" button appends 10 rows; only last 8 are rendered (v1 fidelity)', () => {
    renderGD();
    // Initial state: 1 seed row in history → 1 visible step row.
    expect(document.querySelectorAll('.step-row')).toHaveLength(1);
    // Click "10 ステップ" once. Default x0=5, eta=0.1: bounded trajectory,
    // no divergence → history grows from 1 to 11. v1 last-8 slice → 8 rows.
    fireEvent.click(screen.getByRole('button', { name: '10 ステップ' }));
    expect(document.querySelectorAll('.step-row')).toHaveLength(8);
  });

  it('shows last 8 rows with global step indices 3..10 after one "10 ステップ" click', () => {
    const { container } = renderGD();
    fireEvent.click(screen.getByRole('button', { name: '10 ステップ' }));
    // GradDescent emits LaTeX `\text{step } i:` per row. Last 8 of 0..10 → 3..10.
    expect(container.textContent).toContain('\\text{step } 3:');
    expect(container.textContent).toContain('\\text{step } 10:');
    // Steps 0..2 must be sliced off.
    expect(container.textContent).not.toContain('\\text{step } 0:');
    expect(container.textContent).not.toContain('\\text{step } 1:');
    expect(container.textContent).not.toContain('\\text{step } 2:');
  });
});
