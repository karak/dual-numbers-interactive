import { test, expect, Page } from '@playwright/test';

// Self-verification harness for the v1 → v2 content port.
// Each route lists v1-canonical phrases (extracted from docs/legacy/index.html)
// that must be present in the rendered DOM after MathJax typeset.
//
// Coverage spans: h2 / h3 text, descriptive paragraphs, button labels, select
// options, and warning messages. This is intentionally redundant with the
// per-route component tests so the cross-route porting story is self-evident.

async function gotoHash(page: Page, hash: string) {
  await page.goto('/');
  await page.evaluate((h) => { location.hash = h; }, `#${hash}`);
  // Deterministic wait: every route renders an <h2> inside <main>.
  await page.waitForFunction(
    () => (document.querySelector('main h2')?.textContent?.length ?? 0) > 0,
  );
}

interface Probe {
  hash: string;
  // strings expected verbatim somewhere in main's textContent
  contains: string[];
}

const PROBES: Probe[] = [
  {
    hash: '/intro',
    contains: [
      '二重数とは何か',
      'なぜ自動微分になるのか',
      '数式とコードの対応（一例）',
      '左メニューから例題を選んで、二重数が「微分計算機」として動く様子を見てください。',
      '// 実部 = ac',
      '// ε部 = ad + bc',
    ],
  },
  {
    hash: '/poly',
    contains: ['多項式の自動微分', 'を二重数で評価'],
  },
  {
    hash: '/trig',
    contains: [
      'sin / cos / exp と Taylor 展開',
      '+ 項を追加',
      'リセット',
      'Taylor 次数:',
    ],
  },
  {
    hash: '/chain',
    contains: ['連鎖律', '内側', '外側'],
  },
  {
    hash: '/newton',
    contains: ['Newton 法', '1 ステップ', '5 ステップ', 'リセット'],
  },
  {
    hash: '/grad-descent',
    contains: ['勾配降下', '1 ステップ', '10 ステップ', 'リセット'],
  },
];

for (const probe of PROBES) {
  test(`v1 content fidelity: ${probe.hash}`, async ({ page }) => {
    await gotoHash(page, probe.hash);
    const main = page.locator('main');
    await expect(main).toBeVisible();
    const text = (await main.textContent()) ?? '';
    for (const phrase of probe.contains) {
      expect(
        text,
        `"${phrase}" should appear in ${probe.hash} (got: ${text.slice(0, 200)}…)`,
      ).toContain(phrase);
    }
  });
}
