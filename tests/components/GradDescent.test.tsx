import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  it('shows divergence warning when eta is large and steps run', async () => {
    const user = userEvent.setup();
    renderGD();
    const etaSlider = screen.getByLabelText(/η =/) as HTMLInputElement;
    fireEvent.change(etaSlider, { target: { value: '1.2' } });
    const stepBtn = screen.getByRole('button', { name: /次のステップ/ });
    for (let i = 0; i < 12; i++) await user.click(stepBtn);
    expect(screen.getByRole('alert')).toHaveTextContent(/発散/);
  });
});
