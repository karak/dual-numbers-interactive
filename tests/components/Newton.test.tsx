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

  // Note: a previous v2-only test seeded `initialHistory=[{dfx:1e-9},{dfx:NaN}]`
  // to "trigger the warn", relying on v2's deviation that scanned history for
  // the most recent finite dfx. v1 (docs/legacy/index.html:L637-638) only
  // reads the last row's dfx, which is NaN in normal flow, making the warn
  // dead code in v1. Per the v1-source-of-truth rule, the deviation was
  // reverted (C2 in plans/rustling-swinging-crescent.md) and this seeded
  // assertion was removed because it exercised behaviour v1 cannot produce.
  // The warn DOM ALWAYS renders (`<div class="warn"></div>`) — the textContent
  // toggle is covered by isNewWarningTriggered unit tests.
  it('always renders <div class="warn"></div> (textContent toggled, never removed)', () => {
    renderNewton();
    const warn = document.querySelector('.warn');
    expect(warn).not.toBeNull();
    expect(warn?.textContent).toBe(''); // normal initial state: empty
  });
});
