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
    // Use fireEvent.click (synchronous) so 40 iterations stay fast.
    for (let i = 0; i < 40; i++) fireEvent.click(stepBtn);
    // v1 verbatim: '⚠ 発散しました。学習率 η を小さくしてください。'
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('発散しました。学習率');
    expect(alert).toHaveTextContent('小さくしてください');
    expect(alert).toHaveTextContent('⚠');
    expect(alert).toHaveTextContent('η');
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
});
