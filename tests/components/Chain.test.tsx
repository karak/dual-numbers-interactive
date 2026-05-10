import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import { Chain } from '../../src/routes/Chain';

function renderChain() {
  return render(
    <MathJaxContext version={3}>
      <MemoryRouter>
        <Chain />
      </MemoryRouter>
    </MathJaxContext>,
  );
}

describe('Chain route', () => {
  it('shows the v1 heading "連鎖律"', () => {
    renderChain();
    expect(
      screen.getByRole('heading', { level: 2, name: '連鎖律' }),
    ).toBeInTheDocument();
  });

  it('inner select offers v1 labels x² / x³ / 2x (NOT sin)', () => {
    renderChain();
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const inner = selects[0];
    const labels = Array.from(inner.options).map((o) => o.textContent);
    expect(labels).toEqual(['x²', 'x³', '2x']);
    expect(labels).not.toContain('sin');
  });

  it('outer select offers v1 labels sin u / cos u / e^u', () => {
    renderChain();
    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const outer = selects[1];
    const labels = Array.from(outer.options).map((o) => o.textContent);
    expect(labels).toEqual(['sin u', 'cos u', 'e^u']);
  });

  it('shows v1 control labels "内側" and "外側"', () => {
    const { container } = renderChain();
    expect(container.textContent).toContain('内側');
    expect(container.textContent).toContain('外側');
  });

  it('renders the v1 verbatim slider label "\\(x\\)" (jsdom: literal TeX)', () => {
    const { container } = renderChain();
    expect(container.textContent).toContain('\\(x\\)');
  });

  it('exposes exactly two <select> (inner + outer) and one slider (x)', () => {
    const { container } = renderChain();
    expect(container.querySelectorAll('select')).toHaveLength(2);
    expect(screen.getAllByRole('slider')).toHaveLength(1);
  });
});
