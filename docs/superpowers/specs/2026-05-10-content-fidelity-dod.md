# Content Fidelity DoD — v2 Migration

**Status:** Required acceptance criterion for v2.0.0.
**Reason:** v2 routes were initially ported with structural skeletons but missing v1's
explanatory content (headings, derivation steps, button labels, descriptive paragraphs).
A "faithful port" requires the rendered text to match v1.

## DoD checklist (per route)

For each route, the v2 implementation must satisfy ALL of:

1. **Heading text matches v1** (h2 element, exact string).
2. **Descriptive paragraph(s) match v1** (the `<p>` content directly under the heading).
3. **Step-row LaTeX expressions match v1's compute() output** (formulas, format, ordering).
4. **Control labels match v1** (button text, slider labels, select option labels).
5. **Warning messages match v1** verbatim.
6. **A vitest test exists** asserting at least 2 v1-specific phrases per route via `toHaveTextContent` or `getByRole/getByText`.

## Per-route content inventory (extracted from `docs/legacy/index.html`)

### `/intro` (v1: `examples.intro`)

- h2: `二重数とは何か` (NOT `はじめに` — that's the **menu** label)
- Paragraph 1: definition `二重数は実数の組 a + bε で、記号 ε は ε² = 0 を満たします（しかし ε ≠ 0）。複素数の i² = -1 と並列で考えてみましょう。`
- h3: `なぜ自動微分になるのか`
- Paragraph: `関数 f を x + ε で評価し Taylor 展開すると：`
- Display formula: `f(x + ε) = f(x) + f'(x)ε + ½f''(x)ε² + ⋯ = f(x) + f'(x)ε`
- Paragraph: `ε² = 0 により高次項がすべて消え、実部に f(x)、ε 部に f'(x) が自動的に出るのです。`
- h3: `数式とコードの対応（一例）`
- Paragraph: `乗算規則 (a + bε)(c + dε) = ac + (ad + bc)ε は、そのまま JavaScript で：`
- `<pre>` code block showing `mul(b)` implementation with comments
- Closing paragraph: `左メニューから例題を選んで、二重数が「微分計算機」として動く様子を見てください。`

### `/poly` (v1: `examples.poly`)

- h2: `多項式の自動微分`
- Description: `f(x) = x³ - 2x² + x - 1 を二重数で評価すると、実部に f(x)、ε 部に f'(x) が同時に出ます。`
- Slider: `x` (range -3..3, step 0.01, initial 1.0)
- Step rows (LaTeX, dynamic on `a = state.x`):
  1. `f(x) = x^3 - 2x^2 + x - 1`
  2. `f(${a}+ε) = (${a}+ε)^3 - 2(${a}+ε)^2 + (${a}+ε) - 1`
  3. expansion line with ghost ε² and ε³ terms
  4. `\quad = ${value} + (${derivative})ε  (∵ ε² = 0)` (highlighted)
  5. `∴ f(${a}) = ${value},  f'(${a}) = ${derivative}`

### `/trig` (v1: `examples.trig`)

- h2: `sin / cos / exp と Taylor 展開`
- Function select: options `sin x` / `cos x` / `e^x` (NOT plain `sin`/`cos`/`exp`)
- Slider `x`: range -3..3, step 0.01
- Buttons: `+ 項を追加` (cap 8), `リセット` (back to terms=1). NO subtract button.
- Display: `Taylor 次数: ${terms}` (NOT `項数 = ${terms}`)
- Step rows:
  1. `f(x) = ${latex}` (sin x / cos x / e^x)
  2. expansion line varying by fn (Taylor expansion of e^a·e^ε / sin compound / cos compound)
  3. highlighted: `\quad = ${value} + (${derivative})ε`
  4. conclusion: `∴ f(${a}) = ${value}, f'(${a}) = ${derivative}`

### `/chain` (v1: `examples.chain`)

- h2: `連鎖律`
- Inner select: `x²` / `x³` / `2x` (keys: `sq` / `cube` / `twox` — NOT `sin`)
- Outer select: `sin u` / `cos u` / `e^u` (keys: `sin` / `cos` / `exp`)
- Labels: `内側 g(x):` and `外側 f(u):`
- Slider `x`: range -2..2, step 0.01
- Step rows:
  1. `g(x) = ${innerLatex}, f(u) = ${outerLatex}`
  2. `g(${a} + ε) = ${u.re} + (${u.du})ε`
  3. highlighted: `f(g(${a}+ε)) = ${y.re} + (${y.du})ε`
  4. `(f ∘ g)'(${a}) = f'(g(${a})) · g'(${a}) = ${y.du}`

### `/newton` (v1: `examples.newton`)

- h2: `Newton 法`
- Description: `f(x) = x³ - 2x - 5 の根を x_{n+1} = x_n - f(x_n)/f'(x_n) で求めます。f' は二重数で自動計算。`
- Slider: `初期値 x₀` (range -3..3, step 0.01)
- Buttons: `1 ステップ`, `5 ステップ`, `リセット` (NOT `次のステップ`/`収束まで`)
- Warning: `⚠ f'(x) が 0 に近い：発散の恐れ。初期値を変えてみてください。`
- History rows (LaTeX): `\text{step } ${i}:\; x = ${x},\; f(x) = ${fx},\; f'(x) = ${dfx}`

### `/grad-descent` (v1: `examples.gradDescent`)

- h2: `勾配降下`
- Description: `f(x) = (x-2)² + 1 の最小点を x_{n+1} = x_n - ηf'(x_n) で探します。f' は二重数で自動計算。`
- Sliders:
  - `初期値 x₀`: range -5..9, step 0.01 (initial 5.0)
  - `学習率 η`: range 0.01..1.2, step 0.01 (initial 0.1)
- Buttons: `1 ステップ`, `10 ステップ`, `リセット`
- Warning: `⚠ 発散しました。学習率 η を小さくしてください。`
- History rows (LaTeX, last 8 only): `\text{step } ${i}:\; x = ${x},\; f(x) = ${fx}`

## Verification approach

1. Per-route component test (RTL, Vitest) asserting:
   - h2 heading text via `getByRole('heading', { level: 2, name: '...' })`
   - Description paragraph via `getByText('...')` or `toHaveTextContent('...')`
   - Control labels via `getByRole('button'/'combobox', { name: ... })`
2. Cross-route e2e (Playwright) asserting page text after MathJax typeset.
3. **Diff-style review**: subagent runs against this DoD doc as the reference, reports each gap.
