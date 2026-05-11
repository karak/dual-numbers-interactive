import { useMathJaxTypeset } from '../hooks/useMathJaxTypeset';

/*
 * 1:1 port of examples.intro.render() in docs/legacy/index.html:L331-356.
 *
 * v1 appends these children directly into <main> (no <article>, no
 * className).  We render the same sequence as <Outlet/> children of v2's
 * <main className="main">, then `useMathJaxTypeset()` typesets the
 * container exactly as v1's `typeset(container)` call at L355.
 *
 * Every `$...$` token below is text content in the DOM, not a React
 * component — matches v1 byte-for-byte (modulo React's element wrapper
 * which routes through Outlet).
 */
export function Intro() {
  useMathJaxTypeset();
  return (
    <>
      <h2>{'二重数とは何か'}</h2>
      <p>
        {'二重数は実数の組 '}<strong>{'$a + b\\varepsilon$'}</strong>{' で、記号 $\\varepsilon$ は '}<strong>{'$\\varepsilon^2 = 0$'}</strong>{' を満たします（しかし $\\varepsilon \\ne 0$）。複素数の $i^2 = -1$ と並列で考えてみましょう。'}
      </p>

      <h3>{'なぜ自動微分になるのか'}</h3>
      <p>{'関数 $f$ を $x + \\varepsilon$ で評価し Taylor 展開すると：'}</p>
      <p>{"$f(x + \\varepsilon) = f(x) + f'(x)\\varepsilon + \\tfrac{1}{2}f''(x)\\varepsilon^2 + \\cdots = f(x) + f'(x)\\varepsilon$"}</p>
      <p>
        {'$\\varepsilon^2 = 0$ により高次項がすべて消え、'}<strong>{"実部に $f(x)$、$\\varepsilon$ 部に $f'(x)$ が自動的に出る"}</strong>{'のです。'}
      </p>

      <h3>{'数式とコードの対応（一例）'}</h3>
      <p>{'乗算規則 $(a + b\\varepsilon)(c + d\\varepsilon) = ac + (ad + bc)\\varepsilon$ は、そのまま JavaScript で：'}</p>
      <pre className="code">{`mul(b) {
  return new Dual(
    this.re * b.re,                       // 実部 = ac
    this.re * b.du + this.du * b.re       // ε部 = ad + bc
  );
}`}</pre>
      <p>{'左メニューから例題を選んで、二重数が「微分計算機」として動く様子を見てください。'}</p>
    </>
  );
}
