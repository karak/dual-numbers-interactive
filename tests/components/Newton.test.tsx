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
  it('adds an iteration row when "次のステップ" clicked', async () => {
    const user = userEvent.setup();
    renderNewton();
    const before = screen.queryAllByTestId('newton-step').length;
    await user.click(screen.getByRole('button', { name: /次のステップ/ }));
    expect(screen.queryAllByTestId('newton-step').length).toBe(before + 1);
  });

  it('reset button clears history', async () => {
    const user = userEvent.setup();
    renderNewton();
    await user.click(screen.getByRole('button', { name: /次のステップ/ }));
    await user.click(screen.getByRole('button', { name: /次のステップ/ }));
    await user.click(screen.getByRole('button', { name: /リセット/ }));
    expect(screen.queryAllByTestId('newton-step')).toHaveLength(0);
  });
});
