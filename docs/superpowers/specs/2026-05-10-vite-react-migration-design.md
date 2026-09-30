# Spec: Vite + React + TypeScript 移行 (v2)

- 作成日: 2026-05-10
- 対象: math-dual-numbers (dual-numbers-interactive)
- 前提バージョン: v1.0.0 (single-file vanilla HTML SPA)

## 1. Goal

現行 vanilla HTML SPA (`index.html`, 782 行, 6 ルート) を **Vite + React + TypeScript + Tailwind v4** スタックへ忠実移植する。CLAUDE.md のスタック指定 (TypeScript / React / Tailwind / Vite / shadcn/ui / Vitest / Vercel) に整合させ、TDD ベースで進める。

## 2. Non-goals (YAGNI)

- 新規例題の追加 (例: 偏微分、ベクトル場、ニューラルネット小例題)
- レイアウト/視覚デザインの再構築
- ダークモードトグル、i18n、URL クエリ状態同期などの機能拡張
- v1 と v2 の同時並行運用 (apps/v1 + apps/v2 のような monorepo 化)

## 3. 要件

### 3.1 機能要件 (現行同等性)

R-1. 6 ルート (`#/intro`, `#/poly`, `#/trig`, `#/chain`, `#/newton`, `#/grad-descent`) が現行と同じハッシュ URL でアクセス可能
R-2. サイドバーナビゲーションで全ルート遷移、active 状態を視覚提示
R-3. 各 example ルートで現行と同一の数式・本文・コントロール・グラフ・ステップ表示が再現
R-4. スライダー / セレクト / ボタンの操作で現行同等の応答と再描画
R-5. `#/grad-descent` で η を大きく (>1) 取り発散したとき、現行と同じ「発散」警告を表示
R-6. すべての数式 (本文 inline / step row 内) が MathJax で typeset される
R-7. canvas 描画は devicePixelRatio に応じて鮮明、リサイズに追従
R-8. 既存色トークン (`--accent: #5538e8`, `--accent-soft: #ede9ff`, `--tangent: #6b4eff` 等) を 1:1 で維持

### 3.2 非機能要件

NF-1. **a11y:** Lighthouse Accessibility ≥ 95 (現行 100 を維持目標)、WCAG 2.1 AA カラーコントラスト
NF-2. **テスト:** Vitest 単体 ≥ 27 件 (現行相当) + RTL コンポーネントテスト + Playwright e2e smoke (route sweep / interaction sweep / divergence)
NF-3. **型:** `tsc --noEmit` がノーエラー、`strict: true`
NF-4. **ビルド:** `npm run build` で dist 生成、Vercel フレームワークプリセット (Vite) で即デプロイ可能
NF-5. **CI:** GitHub Actions で typecheck + lint + vitest + playwright を PR gate
NF-6. **バンドルサイズ目標:** initial JS gzip < 200 KB (better-react-mathjax + react + react-router-dom + own code 合計の参考値)

## 4. アーキテクチャ

### 4.1 ディレクトリ構成

```
/                       Vite root (新 index.html はテンプレート最小)
src/
  main.tsx              ReactDOM.createRoot
  App.tsx               <MathJaxContext> > HashRouter > <Layout/> > <Routes/>
  index.css             Tailwind v4 @theme + 既存 design tokens
  lib/
    Dual.ts             Dual class (TS, immutable, pure)
    plot.ts             makePlot, drawAxes, drawCurve, drawPoint
    format.ts           toFixed3, signed 等
    constants.ts        COLORS, EPS, ROUTES
  components/
    Layout.tsx          ヘッダ + サイドバー + <Outlet/>
    Sidebar.tsx         ルートリンク列 (NavLink)
    Plot.tsx            canvas + useCanvas (forwardRef)
    Slider.tsx          ラベル付き range (makeSlider 相当)
    StepRow.tsx         <MathJax inline dynamic> 包み
    Warn.tsx            div role="alert" の発散警告
  hooks/
    useCanvas.ts        DPR + ResizeObserver
    useTypeset.ts       (任意) MathJax 再 typeset 補助
  routes/
    Intro.tsx
    Polynomial.tsx
    Trig.tsx
    Chain.tsx
    Newton.tsx
    GradDescent.tsx
tests/
  unit/
    Dual.test.ts            既存 27 ユニットを移植
    plot.test.ts            軸スケーリング等
    format.test.ts
  components/
    Polynomial.test.tsx
    Newton.test.tsx
    GradDescent.test.tsx
  e2e/
    smoke.spec.ts           現行 tests/run-smoke.mjs を Playwright Test に移植
docs/legacy/
  index.html              v1.0.0 のスナップショット (参照用、commit 済み)
public/                   静的アセット (favicon 等、現状なし)
vite.config.ts
vitest.config.ts
playwright.config.ts
tsconfig.json
.eslintrc.json (or eslint.config.js)
```

### 4.2 主要決定

#### Routing — HashRouter (`react-router-dom` v6+)

- 現行 `#/poly` などの URL を完全保持
- Vercel SPA fallback (rewrites) 設定不要
- ルートは `<Routes>` 配下に列挙、active 状態は `<NavLink>` で `aria-current="page"`

#### MathJax — better-react-mathjax

- ライブラリ: `better-react-mathjax`
- App ルートを `<MathJaxContext config={{loader:{load:['input/tex','output/svg']}}, version: 3}>` でラップ
- 静的式: `<MathJax inline>$f(x) = x^2$</MathJax>`
- 動的更新 (スライダー連動 step row): `<MathJax dynamic key={derivedKey}>...</MathJax>`
- ルート切替時の再 typeset は `<Layout key={pathname}>` で強制

#### Styling — Tailwind v4 + design tokens

- Tailwind v4 (CSS-first)。`src/index.css` 冒頭に:
  ```css
  @import "tailwindcss";
  @theme {
    --color-bg: #0d0d12;
    --color-fg: #f5f5fa;
    --color-accent: #5538e8;
    --color-accent-soft: #ede9ff;
    --color-tangent: #6b4eff;
    --font-family-display: ...;
    /* ... */
  }
  ```
- shadcn/ui は **Sidebar (vertical nav) + Button のみ**選択導入。Card/Slider/Select 等は Tailwind utility 直書き (現行構造を 1:1 で写すため)
- ダーク/ライトは現行同様 `prefers-color-scheme` のみ (トグルなし)

#### Canvas — useCanvas hook

```ts
function useCanvas(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): RefObject<HTMLCanvasElement>
```

- DPR スケーリング、ResizeObserver で w/h 監視、`draw` は副作用なしの純関数
- StrictMode の dev 二重マウント耐性: `draw` は冪等 (clearRect → 描画) を厳守

#### Testing

- **Vitest (jsdom)** で `src/lib/*` の pure 関数 (Dual, plot, format) と pure component (StepRow, Warn) をテスト
- **RTL** でステートフル component (Polynomial, Newton, GradDescent) を user-event ベースでテスト
- **Playwright Test** (`@playwright/test`) で e2e: 現行 `tests/run-smoke.mjs` の routeSweep / interactionSweep / divergenceCheck を `*.spec.ts` に再構成
- canvas 描画の見た目検証は Playwright e2e (screenshot diff) に寄せる。jsdom では canvas API 未提供のため unit では呼ばない
- 既存 27 unit を `Dual.test.ts` に先行ポート → red → Dual.ts 実装 → green の TDD ループ

#### Build & Deploy

- `npm create vite@latest -- --template react-ts` で初期化、`base: './'`
- Vercel: 既存リポジトリを Import → フレームワーク "Vite" 自動検出、`vercel.json` 不要
- GitHub Actions ワークフロー (`.github/workflows/ci.yml`):
  - matrix なし、Node 22.x、`npm ci`、`tsc --noEmit`、`eslint .`、`vitest run`、`playwright install --with-deps chromium`、`playwright test`

#### Migration Safety Net

- 移行作業開始時:
  1. `git tag v1.0.0` を打ち、GitHub Releases に v1.0.0 を作成
  2. `docs/legacy/index.html` に v1 の現行 `index.html` をコピー & コミット (将来比較用)
  3. CHANGELOG.md 作成 (`## [1.0.0] - 2026-05-10` セクション)
- 移行作業中の不変条件:
  - main ブランチは常に動作する。WIP は `feat/v2` ブランチで進行
  - 各 PR で当該ルートの Vitest 単体 + Playwright e2e が緑
- 完了基準:
  - 全 6 ルートが v1 と機能等価 (smoke spec で網羅検証)
  - Lighthouse Accessibility ≥ 95
  - bundle size 目標達成
  - Vercel preview URL 動作確認済み

## 5. データモデル

新規データモデルなし。`Dual` クラスは現行 JS をそのまま TypeScript に型付け移植:

```ts
export class Dual {
  readonly re: number;  // value (real part)
  readonly du: number;  // derivative (dual part, coefficient of ε)
  constructor(re: number, du?: number);
  static c(x: number): Dual;          // constant: du = 0
  static v(x: number): Dual;          // variable: du = 1
  add(b: Dual): Dual;
  sub(b: Dual): Dual;
  mul(b: Dual): Dual;
  div(b: Dual): Dual;
  neg(): Dual;
  pow(n: number): Dual;
  sin(): Dual;
  cos(): Dual;
  exp(): Dual;
  log(): Dual;
}
```

不変条件:
- 全メソッドが新しい `Dual` インスタンスを返す (immutable)
- `re`, `du` は readonly
- `pow(0, n<1)` は `Dual(0, NaN)` を返す (現行ガード保持)
- メソッドは `Dual` 同士のみ受け取る (`number` リテラル受け入れは現行未対応につき YAGNI)

## 6. ルート別コンポーネント仕様 (要点のみ)

### Intro
- 静的本文 + Dual の数学的定義 + ε² = 0 の図示
- 状態なし、MathJax static のみ

### Polynomial
- 状態: `x: number` (slider, [-3, 3])
- f(x) = x³ - 2x² + x - 1, 自動微分による f'(x) を Dual.v(x) で計算
- Plot: 曲線 + 接線、点 (x, f(x))
- StepRow: 各演算ステップを表示

### Trig
- 状態: `kind: 'sin' | 'cos' | 'exp'`, `n: number` (テイラー次数, [-/+ ボタン])
- 選択した関数の Taylor 級数を Dual で逐次計算、級数和の精度を可視化
- Plot: 真値曲線 + 級数近似曲線

### Chain
- 状態: `inner: 'square' | 'cube' | 'sin'`, `outer: 'sin' | 'exp' | 'log'`, `x: number`
- f(g(x)) の合成微分を Dual の連鎖律で計算

### Newton
- 状態: `x: number` (初期値), `iterations: NewtonStep[]` (履歴)
- ステップごとに x_{n+1} = x_n - f(x_n)/f'(x_n) を Dual で 1 回計算
- 「次のステップ」「リセット」「収束まで」ボタン
- 収束履歴をリスト表示

### GradDescent
- 状態: `x: number`, `eta: number`, `iterations: GradStep[]`
- f(x) = (x-2)² + 1 で勾配降下、x_{n+1} = x_n - η·f'(x_n)
- 発散判定: `|x| > 1e6 || !Number.isFinite(f(x))` → `<Warn>` 表示
- 軌跡を canvas にポリラインで重畳

## 7. テスト戦略

### 7.1 単体テスト (Vitest, jsdom)

最低限のカバレッジ目標 (TDD 先行):

| 対象 | テスト例 | 件数目安 |
|---|---|---|
| Dual 基本算術 | add/sub/mul/div の値・微分 | 8 |
| Dual 超越関数 | sin/cos/exp/log/sqrt/pow | 7 |
| Dual エッジケース | pow(0, n<1), log(0), neg, 0 除算 | 4 |
| examples 計算ロジック | 各 route の compute() 同等関数 | 8+ |
| plot util | スケール変換、軸生成 | 3 |

合計 ≥ 27 件 (現行 27 件と同等以上)。

### 7.2 コンポーネントテスト (RTL)

- `Polynomial`: スライダー操作 → 表示中の f'(x) 値が変わる、tangent 線が再描画される (canvas 呼び出しを spy)
- `Newton`: 「次のステップ」3 回押下で iteration row が 3 行になる
- `GradDescent`: η=1.2 で 8 回押下後に `[role="alert"]` が「発散」テキストで表示される

### 7.3 e2e (Playwright Test)

`tests/e2e/smoke.spec.ts` に統合:

- `test('route sweep')`: 6 ルートを巡回し NaN/Infinity/未 typeset $...$ がいずれにも出ない
- `test('interaction sweep')`: 各 route の操作子を操作してコンソールエラー 0
- `test('divergence warning')`: `#/grad-descent` で η=1.2、8 回ステップで `.warn` に「発散」
- `test('a11y smoke')`: axe-core で各 route のアクセシビリティ違反 0 (任意、Lighthouse とは別軸)

## 8. リスクと対策

| リスク | 影響 | 対策 |
|---|---|---|
| MathJax 初期化遅延でちらつき | 体験劣化 | `MathJaxContext` の `hideUntilTypeset="first"` を活用、初回 typeset 完了までコンテンツを隠す |
| Canvas + React StrictMode の二重マウント | 描画重複 | 描画関数を pure 化 (clearRect 必須)、useEffect は 1 関数 |
| Tailwind v4 と shadcn の互換 | スタイル崩れ | shadcn 採用は最小限 (Sidebar/Button のみ)、CLI で v4 互換 component を pull |
| jsdom で canvas 未対応 | 単体不可 | canvas 表示確認は Playwright e2e に集約、unit は計算純関数のみ |
| HashRouter の SEO/共有 | 影響軽微 | 教育デモ用途で SEO 不要、共有 URL は hash 込みで動作 |

## 9. アウトオブスコープ (再掲)

- ストーリーブック / Visual regression
- 国際化 (現行は日本語のみ)
- ダークモード切替トグル
- 状態の URL 同期 (`?x=1.5` 等)
- バンドル分割 (route-based code splitting) — 単一バンドルで十分小さいため不要
- 認証・サーバ側機能

## 10. 参照

- v1 ソース: `index.html` (v1.0.0 タグ)
- v1 仕様: `docs/superpowers/specs/2026-05-10-dual-numbers-demo-design.md`
- v1 実装計画: `docs/superpowers/plans/2026-05-10-dual-numbers-demo.md`
- テスト方針 (v1): `docs/testing.md`
- GitHub: https://github.com/karak/dual-numbers-interactive
