import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import { Trig } from '../../src/routes/Trig';

function renderTrig() {
  return render(
    <MathJaxContext version={3}>
      <MemoryRouter>
        <Trig />
      </MemoryRouter>
    </MathJaxContext>,
  );
}

describe('Trig route', () => {
  it('shows the v1 heading "sin / cos / exp と Taylor 展開"', () => {
    renderTrig();
    expect(
      screen.getByRole('heading', { level: 2, name: 'sin / cos / exp と Taylor 展開' }),
    ).toBeInTheDocument();
  });

  it('exposes "+ 項を追加" and "リセット" buttons (v1 control set)', () => {
    renderTrig();
    expect(screen.getByRole('button', { name: '+ 項を追加' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'リセット' })).toBeInTheDocument();
    // v1 has no decrement button — guard against the regression that added one.
    expect(screen.queryByRole('button', { name: /項数 -/ })).not.toBeInTheDocument();
  });

  it('select offers v1 option labels "sin x" / "cos x" / "e^x"', () => {
    renderTrig();
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    const labels = Array.from(select.options).map((o) => o.textContent);
    expect(labels).toEqual(['sin x', 'cos x', 'e^x']);
  });

  it('shows "Taylor 次数:" indicator (NOT "項数 = ")', () => {
    const { container } = renderTrig();
    expect(container.textContent).toContain('Taylor 次数:');
    expect(container.textContent).not.toContain('項数 =');
  });

  it('"+ 項を追加" caps Taylor degree at 8', async () => {
    const user = userEvent.setup();
    const { container } = renderTrig();
    const addBtn = screen.getByRole('button', { name: '+ 項を追加' });
    // initial = 1; clicking 12 times must stop at 8.
    for (let i = 0; i < 12; i++) await user.click(addBtn);
    expect(container.textContent).toContain('Taylor 次数: 8');
    expect(container.textContent).not.toContain('Taylor 次数: 9');
  });
});
