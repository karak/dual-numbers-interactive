import { MathJax } from 'better-react-mathjax';

// v1 source: examples.intro.render() in docs/legacy/index.html.
// Headings, paragraphs, formula and code block ported verbatim.
export function Intro() {
  return (
    <article className="max-w-none">
      <h2 className="mt-0">二重数とは何か</h2>
      <p>
        二重数は実数の組{' '}
        <strong>
          <MathJax inline>{`\\(a + b\\varepsilon\\)`}</MathJax>
        </strong>{' '}
        で、記号 <MathJax inline>{`\\(\\varepsilon\\)`}</MathJax> は{' '}
        <strong>
          <MathJax inline>{`\\(\\varepsilon^2 = 0\\)`}</MathJax>
        </strong>{' '}
        を満たします（しかし <MathJax inline>{`\\(\\varepsilon \\ne 0\\)`}</MathJax>）。複素数の{' '}
        <MathJax inline>{`\\(i^2 = -1\\)`}</MathJax> と並列で考えてみましょう。
      </p>

      <h3>なぜ自動微分になるのか</h3>
      <p>
        関数 <MathJax inline>{`\\(f\\)`}</MathJax> を{' '}
        <MathJax inline>{`\\(x + \\varepsilon\\)`}</MathJax> で評価し Taylor 展開すると：
      </p>
      <p>
        <MathJax inline>
          {`\\(f(x + \\varepsilon) = f(x) + f'(x)\\varepsilon + \\tfrac{1}{2}f''(x)\\varepsilon^2 + \\cdots = f(x) + f'(x)\\varepsilon\\)`}
        </MathJax>
      </p>
      <p>
        <MathJax inline>{`\\(\\varepsilon^2 = 0\\)`}</MathJax> により高次項がすべて消え、
        <strong>
          実部に <MathJax inline>{`\\(f(x)\\)`}</MathJax>、
          <MathJax inline>{`\\(\\varepsilon\\)`}</MathJax> 部に{' '}
          <MathJax inline>{`\\(f'(x)\\)`}</MathJax> が自動的に出る
        </strong>
        のです。
      </p>

      <h3>数式とコードの対応（一例）</h3>
      <p>
        乗算規則{' '}
        <MathJax inline>{`\\((a + b\\varepsilon)(c + d\\varepsilon) = ac + (ad + bc)\\varepsilon\\)`}</MathJax>{' '}
        は、そのまま JavaScript で：
      </p>
      <pre className="font-[var(--font-mono)] bg-[#f5f3ee] border border-[var(--color-border)] rounded p-3 text-[13px] overflow-x-auto">
{`mul(b) {
  return new Dual(
    this.re * b.re,                       // 実部 = ac
    this.re * b.du + this.du * b.re       // ε部 = ad + bc
  );
}`}
      </pre>
      <p>左メニューから例題を選んで、二重数が「微分計算機」として動く様子を見てください。</p>
    </article>
  );
}
