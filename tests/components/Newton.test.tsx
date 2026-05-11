import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import { Newton } from '../../src/routes/Newton';

function renderNewton() {
  return render(
    <MathJaxContext version={3}>
      <MemoryRouter>
        <Newton />
      </MemoryRouter>
    </MathJaxContext>,
  );
}

describe('Newton route', () => {
  it('shows the v1 heading "Newton 法"', () => {
    renderNewton();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Newton 法' }),
    ).toBeInTheDocument();
  });

  it('shows the v1 description featuring x^3 - 2x - 5', () => {
    const { container } = renderNewton();
    // jsdom does not run MathJax; the inline TeX literal text appears verbatim.
    expect(container.textContent).toContain('x^3 - 2x - 5');
  });

  it('starts with one history row showing initial x_0 (v1 behaviour)', () => {
    renderNewton();
    expect(document.querySelectorAll('.step-row')).toHaveLength(1);
  });

  it('adds an iteration row when "1 ステップ" clicked', async () => {
    const user = userEvent.setup();
    renderNewton();
    const before = document.querySelectorAll('.step-row').length;
    await user.click(screen.getByRole('button', { name: '1 ステップ' }));
    expect(document.querySelectorAll('.step-row').length).toBe(before + 1);
  });

  it('"5 ステップ" appends 5 rows in one click', async () => {
    const user = userEvent.setup();
    renderNewton();
    const before = document.querySelectorAll('.step-row').length;
    await user.click(screen.getByRole('button', { name: '5 ステップ' }));
    expect(document.querySelectorAll('.step-row').length).toBe(before + 5);
  });

  it('reset button resets to single initial-row state', async () => {
    const user = userEvent.setup();
    renderNewton();
    await user.click(screen.getByRole('button', { name: '1 ステップ' }));
    await user.click(screen.getByRole('button', { name: '1 ステップ' }));
    await user.click(screen.getByRole('button', { name: 'リセット' }));
    // v1 always keeps the initial-x0 row visible after reset.
    expect(document.querySelectorAll('.step-row')).toHaveLength(1);
  });

  it('shows the v1 description fragment "の根を"', () => {
    const { container } = renderNewton();
    expect(container.textContent).toContain('の根を');
  });

  it('renders the v1 verbatim slider-label prefix "初期値"', () => {
    const { container } = renderNewton();
    expect(container.textContent).toContain('初期値');
  });

  it('exposes exactly one slider (the x_0 initial-value slider)', () => {
    renderNewton();
    expect(screen.getAllByRole('slider')).toHaveLength(1);
  });

  it('renders the v1 verbatim warning when seeded history has near-zero last dfx', () => {
    // Seed a history whose final-finite dfx is near 0 — the only deterministic
    // way to trigger the warn (Newton on x^3-2x-5 from -3..3 never produces
    // |f'|<1e-6).
    render(
      <MathJaxContext version={3}>
        <MemoryRouter>
          <Newton
            initialHistory={[
              { x: 0.815, fx: -6.46, dfx: 1e-9 },
              { x: 0.815, fx: -6.46, dfx: NaN },
            ]}
          />
        </MemoryRouter>
      </MathJaxContext>,
    );
    // v1 (docs/legacy/index.html:L603) uses <div class="warn">, not role=alert.
    const warn = document.querySelector('.warn')!;
    expect(warn).not.toBeNull();
    expect(warn.textContent).toContain("f'(x) が 0 に近い：発散の恐れ。初期値を変えてみてください。");
    expect(warn.textContent).toContain('⚠');
  });
});
