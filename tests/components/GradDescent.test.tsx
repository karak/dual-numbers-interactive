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
  it('shows divergence warning when eta is large and steps run', () => {
    renderGD();
    const etaSlider = screen.getByLabelText(/η =/) as HTMLInputElement;
    fireEvent.change(etaSlider, { target: { value: '1.2' } });
    const stepBtn = screen.getByRole('button', { name: /次のステップ/ });
    // With eta=1.2, x0=5, |x-2| grows 1.4×/step; reaching |x|>1e6 needs ~38 steps.
    // Use fireEvent.click (synchronous) so 40 iterations stay fast.
    for (let i = 0; i < 40; i++) fireEvent.click(stepBtn);
    expect(screen.getByRole('alert')).toHaveTextContent(/発散/);
  });
});
