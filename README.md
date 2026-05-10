# Dual Numbers — Interactive

大学生向けの二重数（$a + b\varepsilon$, $\varepsilon^2 = 0$）と前向きモード自動微分の単一 HTML インタラクティブデモ。

## 起動方法

```bash
python3 -m http.server 8000
# → http://localhost:8000/
# セルフテスト → http://localhost:8000/#test
```

## 例題

導入 / 多項式の自動微分 / sin·cos·exp と Taylor 展開 / 連鎖律 / Newton 法 / 勾配降下

## デプロイ

`index.html` 一枚を Vercel など静的ホスティングへ配置。MathJax は CDN 経由。
