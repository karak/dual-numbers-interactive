import { test } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const V1_PATH = path.resolve('docs/legacy/index.html');
const V1_URL = 'file://' + V1_PATH;

const ROUTES = [
  { hash: '#/intro', slug: 'intro' },
  { hash: '#/poly', slug: 'poly' },
  { hash: '#/trig', slug: 'trig' },
  { hash: '#/chain', slug: 'chain' },
  { hash: '#/newton', slug: 'newton' },
  { hash: '#/grad-descent', slug: 'grad-descent' },
];

const OUT_DIR = path.resolve('tests/screenshots');

test.beforeAll(() => {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
});

// Visual snapshot capture: produces 12 PNGs (6 routes x 2 versions) under
// tests/screenshots/ for the controller to diff. We keep both pages in their
// natural typeset state (v1: MathJax CDN; v2: better-react-mathjax) so the
// captures reflect what a real user sees. Pixel-level equality is not the
// goal — the controller compares layout, spacing, typography, and colour.
test.describe('visual snapshot capture (v1 vs v2)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  for (const r of ROUTES) {
    test(`snapshot ${r.slug}`, async ({ page, browser }) => {
      // ---- v1 (file://) ----
      const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
      const v1Page = await v1Ctx.newPage();
      await v1Page.goto(V1_URL, { waitUntil: 'domcontentloaded' });
      await v1Page.evaluate((h) => {
        location.hash = h;
      }, r.hash);
      await v1Page.waitForFunction(
        () => (document.querySelector('main h2')?.textContent?.length ?? 0) > 0,
      );
      // Allow MathJax CDN to fetch + typeset. CDN can be slow on cold cache.
      await v1Page.waitForTimeout(3000);
      await v1Page.screenshot({
        path: path.join(OUT_DIR, `v1-${r.slug}.png`),
        fullPage: true,
      });
      await v1Ctx.close();

      // ---- v2 (dev server via Playwright webServer) ----
      await page.goto('/');
      await page.evaluate((h) => {
        location.hash = h;
      }, r.hash);
      await page.waitForFunction(
        () => (document.querySelector('main h2')?.textContent?.length ?? 0) > 0,
      );
      // Allow better-react-mathjax to finish dynamic-import + typeset.
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: path.join(OUT_DIR, `v2-${r.slug}.png`),
        fullPage: true,
      });
    });
  }
});
