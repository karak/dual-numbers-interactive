import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import { Polynomial } from '../../src/routes/Polynomial';

function renderPoly() {
  return render(
    <MathJaxContext version={3}>
      <MemoryRouter>
        <Polynomial />
      </MemoryRouter>
    </MathJaxContext>,
  );
}

describe('Polynomial route', () => {
  it('shows the heading', () => {
    renderPoly();
    expect(screen.getByRole('heading', { name: /多項式/ })).toBeInTheDocument();
  });

  it('updates value/derivative display when slider moves to x=2', () => {
    renderPoly();
    const slider = screen.getByLabelText(/x =/) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '2' } });
    // f(2) = 1, f'(2) = 5  → fmt3 formats as '1.000' / '5.000'
    expect(screen.getByTestId('value')).toHaveTextContent('1.000');
    expect(screen.getByTestId('derivative')).toHaveTextContent('5.000');
  });
});
