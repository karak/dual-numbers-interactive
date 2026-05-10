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
  it('shows the v1 heading "多項式の自動微分"', () => {
    renderPoly();
    // exact match — guards against the regression where heading was just '多項式'
    expect(
      screen.getByRole('heading', { level: 2, name: '多項式の自動微分' }),
    ).toBeInTheDocument();
  });

  it('renders the v1 derivation including the f(x) = x^3 - 2x^2 + x - 1 row', () => {
    const { container } = renderPoly();
    // jsdom does not run MathJax — the raw LaTeX text is what we assert against.
    expect(container.textContent).toContain('x^3 - 2x^2 + x - 1');
  });

  it('shows the v1 description fragment "を二重数で評価"', () => {
    const { container } = renderPoly();
    expect(container.textContent).toContain('を二重数で評価');
  });

  it('updates value/derivative display when slider moves to x=2', () => {
    renderPoly();
    const slider = screen.getByRole('slider') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '2' } });
    // f(2) = 1, f'(2) = 5  → fmt3 formats as '1.000' / '5.000'
    expect(screen.getByTestId('value')).toHaveTextContent('1.000');
    expect(screen.getByTestId('derivative')).toHaveTextContent('5.000');
  });
});
