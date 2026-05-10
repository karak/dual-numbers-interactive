# 二重数インタラクティブデモ 設計書

- **作成日**: 2026-05-10
- **対象**: 大学生（数学・情報系学部）
- **目的**: 二重数 (a + bε, ε² = 0) の概念を、計算機科学での有用性と共に直感的に理解させる
- **形式**: 単一 HTML ファイル（CDN 許可）

## 1. 全体アーキテクチャ

### 1.1 配信形態

- **単一 HTML ファイル** で完結。`<script>` / `<style>` / `<svg>` をインライン化。
- **CDN 依存は MathJax v3 のみ**:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
  ```
- ビルド工程なし。`index.html` をブラウザで開けば動作する。Vercel に静的配置可能。

### 1.2 SPA 構成

- **Hash routing**: `#/intro`, `#/poly`, `#/trig`, `#/chain`, `#/newton`, `#/grad-descent`, `#test`
- **タブ式 SPA**: サイドバー（左 240px）にメニュー、メイン領域に該当例題を描画。
- フレームワーク不使用。`window.addEventListener('hashchange', router)` で切替。

### 1.3 関数設計（純粋関数 / 副作用の分離）

各例題ごとに以下を分離:

```
compute(state) -> { value, derivative, steps: LatexStep[] }   // 純関数
render(container, result, state) -> void                      // DOM 操作
```

- `compute()` は DOM に触れず、ユニットテスト可能。
- `render()` は `compute()` の結果を受け取り、MathJax / Canvas / DOM を更新する責務のみ。

### 1.4 ディレクトリ構造（単一ファイル内の論理セクション）

```
index.html
├── <style>      … 全 CSS（design tokens + layout + components）
├── <body>       … skeleton（header / aside / main）
└── <script>
    ├── class Dual                           … 二重数演算
    ├── examples = { intro, poly, trig, ... }… 各例題の {compute, render, ui}
    ├── router()                             … hash → render dispatcher
    ├── ui helpers (slider, formula panel, canvas2d)
    └── self-test (#test ハッシュで起動)
```

## 2. Dual クラス API

### 2.1 設計方針

- `re` (real part) と `du` (dual part: ε の係数) を持つイミュータブル風オブジェクト。
- メソッドは新しい `Dual` を返す（`this` を破壊しない）。
- 静的ファクトリ `Dual.c(x)` (定数), `Dual.v(x)` (変数: 微分点) で意図を明示。

### 2.2 完全 API

```js
class Dual {
  constructor(re, du = 0) { this.re = re; this.du = du; }
  static c(x) { return new Dual(x, 0); }       // 定数
  static v(x) { return new Dual(x, 1); }       // 変数（微分点）
  add(b) { return new Dual(this.re + b.re, this.du + b.du); }
  sub(b) { return new Dual(this.re - b.re, this.du - b.du); }
  mul(b) { return new Dual(this.re * b.re,
                            this.re * b.du + this.du * b.re); }
  div(b) {
    const r = b.re;
    return new Dual(this.re / r, (this.du * r - this.re * b.du) / (r * r));
  }
  neg()  { return new Dual(-this.re, -this.du); }
  sin()  { return new Dual(Math.sin(this.re),  Math.cos(this.re) * this.du); }
  cos()  { return new Dual(Math.cos(this.re), -Math.sin(this.re) * this.du); }
  exp()  { const e = Math.exp(this.re);
           return new Dual(e, e * this.du); }
  log()  { return new Dual(Math.log(this.re), this.du / this.re); }
  pow(n) {
    const r = Math.pow(this.re, n);
    return new Dual(r, n * Math.pow(this.re, n - 1) * this.du);
  }
}
```

### 2.3 学生への可視性方針

- **Dual クラスのコードは導入ページ (`#/intro`) のみで 1 箇所だけ表示**。
- 表示するのは「数式とコードの対応」を示すための乗算規則のみ:
  ```
  (a + bε)(c + dε) = ac + (ad + bc)ε       ←  数式
  mul(b) {                                  ←  対応する JS
    return new Dual(this.re*b.re,
                    this.re*b.du + this.du*b.re);
  }
  ```
- 他のページでは **学生は数式・グラフ・スライダーのみを見る**。実装の存在は意識させない。

## 3. ページ構成と各例題の仕様

### 3.1 共通 UI レイアウト

```
┌────────────────────────────────────────────────────┐
│ Header: Dual Numbers — Interactive                 │
├──────────┬─────────────────────────────────────────┤
│ Sidebar  │ Main                                    │
│ ・導入    │  ┌──────────────────┐ ┌──────────────┐ │
│ ・多項式  │  │  数式パネル        │ │  グラフ      │ │
│ ・三角関数 │  │  (MathJax)       │ │  Canvas      │ │
│ ・連鎖律  │  │  step-by-step    │ │  600x360     │ │
│ ・Newton │  └──────────────────┘ └──────────────┘ │
│ ・勾配降下 │  入力 UI（slider / number / play）       │
└──────────┴─────────────────────────────────────────┘
```

### 3.2 例題① 導入 (`#/intro`)

- **ねらい**: 「二重数とは何か」「なぜ ε² = 0 なのか」「コードと数式が一対一対応する」
- **コンテンツ**:
  - 定義: `a + bε, ε² = 0`
  - Taylor 展開を ε² で打ち切ると 1 階導関数が自然に出てくる
  - 乗算規則の数式とコード並置（唯一のコード露出箇所）
- **インタラクション**: なし（テキスト + 数式のみ）

### 3.3 例題② 多項式の自動微分 (`#/poly`)

- **対象式**: `f(x) = x³ - 2x² + x - 1`（既定）。係数調整も可能。
- **インタラクション**: スライダーで `x` ∈ [-3, 3] を動かす。
- **数式パネル**（step-by-step）:
  ```
  f(x + ε) = (x + ε)³ - 2(x + ε)² + (x + ε) - 1
           = (x³ + 3x²ε + 3xε² + ε³)
             - 2(x² + 2xε + ε²) + x + ε - 1
           = x³ - 2x² + x - 1
             + (3x² - 4x + 1)ε  + O(ε²)        ← ε² 以降は薄色
           = f(x) + f'(x)·ε       ∴ f'(x) = 3x² - 4x + 1
  ```
- **グラフ**: `f(x)` の曲線（黒）と現在点 `x` における接線（紫、傾き = f'(x)）。

### 3.4 例題③ sin / cos / exp と Taylor 展開 (`#/trig`)

- **対象式**: 選択式（sin / cos / exp）。
- **インタラクション**:
  - スライダーで `x` を動かす。
  - 「Taylor 展開を 1 項ずつ追加」ボタン（`requestAnimationFrame` でアニメ）。
- **数式パネル**:
  ```
  sin(x + ε) = sin(x)cos(ε) + cos(x)sin(ε)
             ≈ sin(x)·1 + cos(x)·ε    (∵ cos ε ≈ 1, sin ε ≈ ε for small ε; ε²=0 で厳密)
             = sin(x) + cos(x)·ε
  ```
- **グラフ**: 元関数 + Taylor 部分和（項を追加するごとに近似が改善する様子を可視化）。

### 3.5 例題④ 連鎖律 (`#/chain`)

- **対象式**: `f(g(x))` の合成。例: `f(u) = sin(u), g(x) = x²` → `sin(x²)`
- **インタラクション**: 内側関数 g、外側関数 f をプリセットから選択。`x` をスライダー。
- **数式パネル**（step-by-step）:
  ```
  入力 x + ε に対し:
    g(x + ε) = x² + 2xε                       (内側: g'(x) = 2x)
    f(g(x+ε)) = sin(x² + 2xε)
              = sin(x²) + cos(x²)·(2xε)        (外側に二重数を渡す)
              = sin(x²) + 2x cos(x²) · ε
  ∴ (f∘g)'(x) = 2x cos(x²) = f'(g(x))·g'(x)   ← 連鎖律が自動で出る！
  ```
- **グラフ**: 合成関数の曲線 + 接線。

### 3.6 例題⑤ Newton 法 (`#/newton`)

- **対象式**: `f(x) = x³ - 2x - 5`（既定。プリセット切替可）
- **インタラクション**:
  - 初期値 `x₀` をスライダーで選択。
  - 「1 ステップ進める」「5 ステップ自動」ボタン。
- **数式パネル**: 各イテレーションを表示
  ```
  x_{n+1} = x_n - f(x_n)/f'(x_n)
  step 0: x = 2.0,    f(x) = -1.0,   f'(x) = 10.0,   x' = 2.1
  step 1: x = 2.1,    f(x) =  0.061, f'(x) = 11.23,  x' = 2.0945
  ...収束
  ```
- **グラフ**: 関数曲線 + 各反復の接線が x 軸を切る様子（既存接線は薄く残す）。
- **エッジケース**: `|f'(x)| < ε` のとき発散警告を表示（教育機会として活かす）。

### 3.7 例題⑥ 勾配降下 (`#/grad-descent`)

- **対象式**: 1 変数の凸関数 `f(x) = (x-2)² + 1`（既定）。多変数の前段階として 1D。
- **インタラクション**: 学習率 η、初期値 `x₀`、ステップ数。
- **数式パネル**:
  ```
  x_{n+1} = x_n - η · f'(x_n)
  η = 0.1, x₀ = 5.0
  step 0: f'(5.0) = 6.0,    x' = 4.4
  step 1: f'(4.4) = 4.8,    x' = 3.92
  ...
  ```
- **グラフ**: 関数曲線 + 軌跡（点列を線で結ぶ）。
- **エッジケース**: η が大きすぎて発散したら学習率調整のヒントを表示。

## 4. デザインシステム

### 4.1 デザイン哲学

**モダン・アカデミック**: Stripe / Linear の余白とタイポ感を、学術論文/教科書の佇まいに寄せる。
派手なグラデーション・影は使わない。フラットでクリーン。紙の質感。

### 4.2 デザイントークン（CSS Custom Properties）

```css
:root {
  --bg:           #fafaf7;   /* off-white（紙の質感） */
  --surface:      #ffffff;   /* card */
  --ink:          #1a1a1a;   /* 主要テキスト */
  --ink-soft:     #4a4a4a;   /* 副次テキスト */
  --border:       #e8e6e0;
  --accent:       #6b4eff;   /* indigo 寄り紫（リンク・アクティブ・接線） */
  --accent-soft:  #ede9ff;
  --curve:        #1a1a1a;   /* 関数曲線（黒） */
  --tangent:      #6b4eff;   /* 接線・軌跡 */
  --ghost:        #b8b3a8;   /* 薄色（ε² 以降の項） */

  --radius:       4px;
  --pad:          24px;
  --gap:          16px;

  --font-body:    'Noto Serif JP', 'Source Serif Pro', Georgia, serif;
  --font-ui:      -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif;
  --font-mono:    'JetBrains Mono', Menlo, monospace;
}
```

### 4.3 タイポグラフィ

| 用途       | フォント                                 | 補足                            |
|------------|------------------------------------------|---------------------------------|
| 本文       | Noto Serif JP / Source Serif Pro / Georgia | 教科書らしいセリフ              |
| UI         | -apple-system / BlinkMacSystemFont / Hiragino Sans | **Inter は意図的に避ける** |
| 数式       | MathJax 既定 (Latin Modern)              | 触らない                        |
| コード     | JetBrains Mono / Menlo                   | 等幅                            |

### 4.4 レイアウト

- 最大幅 `1200px`、中央寄せ。
- カード: `border: 1px solid var(--border); border-radius: 4px; padding: 24px; background: var(--surface);`（影なし）。
- サイドバー幅 `240px`、固定。
- グリッド: 数式パネル（左）と Canvas（右）を 1fr / 600px の 2 カラムに配置。狭幅では縦積み。

### 4.5 色の機能割当

- 関数曲線 = `--curve`（黒）
- 接線・軌跡 = `--tangent` = `--accent`（紫）
- ε² 以降の項 = `--ghost`（薄ベージュ） — 「打ち切られる」感覚を視覚化
- アクティブメニュー / リンク = `--accent`

### 4.6 アクセシビリティ

- WCAG AA 準拠の色コントラスト（`--ink` on `--bg` で 14:1 程度）。
- スライダーはキーボード操作可能（`<input type="range">` ネイティブ）。
- フォーカスリング `outline: 2px solid var(--accent); outline-offset: 2px;`
- `prefers-reduced-motion` を尊重し、Taylor アニメを瞬時表示に切替。
- セマンティック HTML（`<nav>`, `<main>`, `<section>`, `<aside>`）。

## 5. データフローと状態管理

### 5.1 状態モデル

各例題は **ローカル状態オブジェクト**を持つ:

```js
const polyState = { x: 1.0 };
const newtonState = { x0: 2.0, step: 0, history: [] };
const gradState = { x0: 5.0, eta: 0.1, step: 0, history: [] };
```

ルーター切替時には `initialState()` で状態をリセットする（§5.5 と整合）。グローバル状態ストアは不要。

### 5.2 Compute → Render パイプライン

```
[user input] → [state update] → compute(state) → result → render(container, result, state)
                                       ↓
                                    純関数（DOM なし）
                                    →  unit test 可能
```

### 5.3 MathJax 再描画

- `MathJax.typesetClear([container])` で前回の SVG を破棄してから `MathJax.typeset([container])` を呼ぶ。
- 数式パネル全体ではなくステップごとに `<div>` を分け、必要分のみ再描画する。
- スライダーの連続変化は `requestAnimationFrame` でデバウンス。

### 5.4 Canvas 描画

- `<canvas width="600" height="360">`、`devicePixelRatio` を考慮した `setTransform` でぼやけ回避。
- 描画関数は `(ctx, fn, range) => void` のシンプルなシグネチャ。
- 接線・軌跡は別レイヤー扱いで都度クリア＆再描画（複雑な diff は不要な規模）。

### 5.5 ルーティング

```js
const routes = {
  '#/intro': examples.intro,
  '#/poly':  examples.poly,
  // …
};
function router() {
  const ex = routes[location.hash] || examples.intro;
  ex.render(document.getElementById('main'), ex.initialState());
}
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
```

## 6. 検証・テスト方針

### 6.1 自動セルフテスト（`#test`）

外部テストランナーは使わず、`location.hash === '#test'` で起動する内蔵セルフテスト。

```js
function runSelfTest() {
  const tests = [];
  const eq = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

  // Dual クラスの基本演算
  tests.push(['v(2).pow(3)', () => {
    const r = Dual.v(2).pow(3);
    return eq(r.re, 8) && eq(r.du, 12);
  }]);
  tests.push(['v(0).sin()', () => {
    const r = Dual.v(0).sin();
    return eq(r.re, 0) && eq(r.du, 1);
  }]);
  // 各 example の compute() の出力を解析的微分と照合
  // …
}
```

- ページ上に PASS / FAIL を一覧表示。デプロイ前確認用。

### 6.2 手動受入検証

- スライダーを端から端まで動かして `NaN` / `Infinity` が出ないこと（`log(負数)` 等は事前ガード）。
- MathJax 再描画時にゴースト残りが無いこと（`typesetClear` 必須）。
- Retina で線がボケないこと（`devicePixelRatio` 適用済みか）。
- キーボードのみで全機能到達可能であること。
- Lighthouse Accessibility ≥ 90、Chrome / Safari / Firefox 最新版で動作。

### 6.3 エッジケース

| ケース                          | 対処                                        |
|---------------------------------|---------------------------------------------|
| Newton で `f'(x) ≈ 0`           | 発散警告を表示（教育的に活用）              |
| 勾配降下で η 大きすぎ → 発散    | 学習率調整ヒント                            |
| `log(x)` で `x ≤ 0`             | スライダー範囲をプリセットで制限            |
| Taylor アニメの過剰再描画       | `requestAnimationFrame` でスロットル        |
| ハッシュ未指定 / 未知のハッシュ | `#/intro` にフォールバック                  |

## 7. 非スコープ（YAGNI）

- 多変数勾配降下（1 変数で概念は伝わる）
- 逆向きモード自動微分（前向きで二重数の本旨は十分）
- 数式エディタ（プリセット切替で十分）
- ユーザーの状態保存（リロード前提）
- 多言語対応（日本語のみ）
- ダークモード（紙の質感を優先）

## 8. 成功基準

- 大学生が初見で 10 分以内に「二重数 = 自動微分の自然な実装」と理解できる。
- すべての数式変形が step-by-step で追える（Taylor 展開の中間ステップが省略されない）。
- 単一 HTML ファイル + MathJax CDN のみで動作する。
- 5 つの例題すべてがインタラクティブに動く。
- セルフテスト（`#test`）が全項目 PASS。
- Lighthouse Accessibility ≥ 90。
