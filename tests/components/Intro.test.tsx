import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import { Intro } from '../../src/routes/Intro';

function renderIntro() {
  return render(
    <MathJaxContext version={3}>
      <MemoryRouter>
        <Intro />
      </MemoryRouter>
    </MathJaxContext>,
  );
}

describe('Intro route', () => {
  it('shows the v1 heading "二重数とは何か"', () => {
    renderIntro();
    expect(
      screen.getByRole('heading', { level: 2, name: '二重数とは何か' }),
    ).toBeInTheDocument();
  });

  it('contains the subheading "なぜ自動微分になるのか"', () => {
    renderIntro();
    expect(
      screen.getByRole('heading', { level: 3, name: 'なぜ自動微分になるのか' }),
    ).toBeInTheDocument();
  });

  it('contains the subheading "数式とコードの対応（一例）"', () => {
    renderIntro();
    expect(
      screen.getByRole('heading', { level: 3, name: '数式とコードの対応（一例）' }),
    ).toBeInTheDocument();
  });

  it('contains the closing paragraph phrase from v1', () => {
    const { container } = renderIntro();
    expect(container.textContent).toContain(
      '左メニューから例題を選んで、二重数が「微分計算機」として動く様子を見てください。',
    );
  });

  it('embeds the mul(b) code block (v1 verbatim)', () => {
    const { container } = renderIntro();
    // pre block keeps newlines and Japanese inline comments intact.
    expect(container.textContent).toContain('// 実部 = ac');
    expect(container.textContent).toContain('// ε部 = ad + bc');
  });
});
