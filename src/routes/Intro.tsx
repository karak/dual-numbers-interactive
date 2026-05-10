import { MathJax } from 'better-react-mathjax';

export function Intro() {
  return (
    <article className="prose max-w-none">
      <h2 className="font-[var(--font-ui)] mt-0">はじめに</h2>
      <p>
        <MathJax inline>{`\\(\\textbf{二重数 (dual number)}\\)`}</MathJax>{' '}
        は、<MathJax inline>{`\\(\\varepsilon^2 = 0\\)`}</MathJax> を満たす形式記号{' '}
        <MathJax inline>{`\\(\\varepsilon\\)`}</MathJax> を実数体に付加した{' '}
        <MathJax inline>{`\\(a + b\\varepsilon\\)`}</MathJax> の形の数です。
      </p>
      <p>
        関数 <MathJax inline>{`\\(f\\)`}</MathJax> に <MathJax inline>{`\\(x + \\varepsilon\\)`}</MathJax>{' '}
        を代入すると、Taylor 展開により{' '}
        <MathJax inline>{`\\(f(x + \\varepsilon) = f(x) + f'(x)\\varepsilon\\)`}</MathJax>{' '}
        となり、<strong>関数値と微分が同時に得られます</strong>。これが前進モード自動微分の核心です。
      </p>
      <p>左のメニューから例題を選んでください。</p>
    </article>
  );
}
