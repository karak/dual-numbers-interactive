# テスト・検証ガイド

このプロジェクトには **3 段階** の検証手段があります。

| レイヤ | 何を見るか | 実行場所 |
|---|---|---|
| 1. ユニットテスト（in-page） | `Dual` クラスの算術・微分、各 `compute()` の数値正解 | ブラウザの `#test` ページ |
| 2. ブラウザスモーク（Playwright） | ルート遷移・MathJax レンダリング・スライダー操作・発散警告 | Node + 実ブラウザ |
| 3. Lighthouse a11y | アクセシビリティスコア、コントラスト、ラベル関連付け | Chrome DevTools / chrome-devtools-mcp |

---

## 1. ユニットテスト（27 件）

ローカルに HTTP サーバーを立てて `#test` を開きます。

```bash
python3 -m http.server 8000
# → http://localhost:8000/#test
```

期待出力: `27 passed, 0 failed`。
コード本体は `index.html` 内の `__tests` 配列で、`test('name', fn)` 形式で追加・実行されます。

CI で動かしたい場合は別途 Node スクリプトで `<script>` ブロックを抽出して評価する形を取ります（詳しくは `tests/run-smoke.mjs` 参照）。

---

## 2. ブラウザスモーク

### 2.1 DevTools コンソール貼り付け（手動・最速）

1. ブラウザで `http://localhost:8000/` を開く
2. DevTools コンソールを開く
3. `tests/browser-smoke.mjs` の中身を一括コピペし、`await runAll()` を実行
4. 戻り値の `unit.summary`, `routes[*].rawTexLeftover`, `divergence.warnText` などを目視確認

### 2.2 Playwright 自動実行

```bash
npm i -D playwright
npx playwright install chromium
python3 -m http.server 8000  # 別ターミナルで先に起動
node tests/run-smoke.mjs
# 別ポートを使う場合
PORT=8765 node tests/run-smoke.mjs
```

このスクリプトは以下を検査して、いずれか失敗で `exit 1` します。

- 全ユニットテスト合格
- 6 ルート全てで `NaN` / `Infinity` / 未レンダリング `$...$` が画面に出ない
- スライダー・ボタンを一通り操作してもコンソールエラーが 0
- `#/grad-descent` で η=1.2 をかけて回すと「発散」警告が出る

### 2.3 何を検出できるか・できないか

検出できる:

- MathJax の typeset 漏れ（過去事例: `examples.poly/trig/chain` の説明段落の inline math が未レンダリング）
- 任意ルートで NaN / Infinity が表示されてしまう計算バグ
- スライダー入力時のランタイムエラー
- 発散検知ロジックのデグレ

検出できない（人間の目で確認が必要）:

- 視覚的な余白・タイポグラフィ・カラーバランス
- アニメーションのフィーリング
- 色覚多様性配慮

---

## 3. Lighthouse a11y 監査

### 3.1 Chrome DevTools 手動実行

1. `http://localhost:8000/` を Chrome で開く
2. DevTools → Lighthouse タブ → Categories: Accessibility → Analyze page load

期待値: **Accessibility ≥ 95**。コントラスト不足やラベル関連付けが落ちると点数が下がります。

### 3.2 Claude Code 経由（chrome-devtools-mcp）

`chrome-devtools-mcp` が利用可能な環境では、navigate_page → lighthouse_audit を順に呼ぶと
JSON レポートが `/var/folders/.../report.json` に出力されます。`audits['color-contrast'].details.items` を見ると
違反箇所のセレクタと実測コントラスト比が分かります。

過去事例: `--accent: #6b4eff` を `--accent-soft: #ede9ff` の上に置いた active サイドバーリンクが 4.25:1（AA は 4.5 必須）で失敗。
→ `--accent: #5538e8` に変更して 100 点に修正済み（commit 参照）。

---

## 4. 既知の検証ギャップ

- **クロスブラウザ**: Chrome 系のみ自動化済み。Firefox / Safari は手動確認が必要。
- **モバイルレイアウト**: 現状デスクトップ前提のレイアウト。Lighthouse mobile audit と実機確認は未実施。
- **長時間操作**: 数百回のスライダードラッグ後の MathJax メモリリーク等は未測定。
