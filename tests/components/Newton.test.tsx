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
    expect(screen.queryAllByTestId('newton-step')).toHaveLength(1);
  });

  it('adds an iteration row when "1 ステップ" clicked', async () => {
    const user = userEvent.setup();
    renderNewton();
    const before = screen.queryAllByTestId('newton-step').length;
    await user.click(screen.getByRole('button', { name: '1 ステップ' }));
    expect(screen.queryAllByTestId('newton-step').length).toBe(before + 1);
  });

  it('"5 ステップ" appends 5 rows in one click', async () => {
    const user = userEvent.setup();
    renderNewton();
    const before = screen.queryAllByTestId('newton-step').length;
    await user.click(screen.getByRole('button', { name: '5 ステップ' }));
    expect(screen.queryAllByTestId('newton-step').length).toBe(before + 5);
  });

  it('reset button resets to single initial-row state', async () => {
    const user = userEvent.setup();
    renderNewton();
    await user.click(screen.getByRole('button', { name: '1 ステップ' }));
    await user.click(screen.getByRole('button', { name: '1 ステップ' }));
    await user.click(screen.getByRole('button', { name: 'リセット' }));
    // v1 always keeps the initial-x0 row visible after reset.
    expect(screen.queryAllByTestId('newton-step')).toHaveLength(1);
  });
});
