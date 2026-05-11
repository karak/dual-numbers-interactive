import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Permanent bounding-rect parity audit against v1.  This file's predecessors
// (the disposable `_r*.spec.ts` scratch scripts) drove rounds 6-9 of the
// migration; round-9 closed every gap.  Promoting the scan as a checked-in
// test prevents the layout from silently drifting against v1 again, the way
// the round-1 hand-written DoD did.
//
// For each route, we measure a fixed set of selectors in v1 (loaded as a
// `file://` URL with MathJax CDN active for byte-faithful SVG output) and
// in v2 (served by the Playwright webServer).  Every selector's top/left,
// width/height, font-size and line-height must match within tight tolerances.
// Margin top/bottom are also checked because flex / space-y / preflight
// regressions tend to surface there first.

const here = path.dirname(fileURLToPath(import.meta.url));
const V1_FILE_URL = `file://${path.resolve(here, '..', '..', 'docs/legacy/index.html')}`;

const ROUTES = ['intro', 'poly', 'trig', 'chain', 'newton', 'grad-descent'] as const;

// Selectors chosen to cover every visible structural concern:
//   - layout chrome: header, main
//   - typography: h2, h3, p, label
//   - controls: select, button, range
//   - plot: canvas
//   - dynamic math content: step-row(-highlight)
const SELECTORS = [
  'header',
  'main',
  'main h2',
  'main h3',
  'main p',
  'main label',
  'main select',
  'main button',
  'main input[type=range]',
  'main canvas',
  '.step-row, .step-row-highlight',
] as const;

interface ElementSnap {
  t: number; l: number; w: number; h: number;
  fs: string; lh: string; mt: string; mb: string;
  color: string; bg: string;
}

async function snapRoute(page: import('@playwright/test').Page) {
  return await page.evaluate((sels: readonly string[]) => {
    const out: Record<string, ElementSnap[]> = {};
    for (const sel of sels) {
      const els = Array.from(document.querySelectorAll(sel));
      out[sel] = els.map((el) => {
        const rect = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          t: Math.round(rect.top * 10) / 10,
          l: Math.round(rect.left * 10) / 10,
          w: Math.round(rect.width * 10) / 10,
          h: Math.round(rect.height * 10) / 10,
          fs: cs.fontSize,
          lh: cs.lineHeight,
          mt: cs.marginTop,
          mb: cs.marginBottom,
          color: cs.color,
          bg: cs.backgroundColor,
        };
      });
    }
    return out;
  }, SELECTORS as unknown as string[]);
}

// 2px tolerance on geometry is enough to absorb sub-pixel snapping and
// font-metric differences between MathJax's CDN bundle and the npm one
// without admitting whole-row drifts (4px+).
const TOL = { t: 2, l: 2, w: 3, h: 3, fs: 0.5, lh: 0.5, mt: 0.5, mb: 0.5 } as const;

test.describe.configure({ mode: 'serial' });

for (const route of ROUTES) {
  test(`v1 parity: #/${route} bounding-rect snapshot matches v1`, async ({ page, browser }) => {
    // ----- v1 -----
    const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const v1Page = await v1Ctx.newPage();
    await v1Page.goto(`${V1_FILE_URL}#/${route}`, { waitUntil: 'networkidle' });
    await v1Page.waitForFunction(() => (document.querySelector('main h2')?.textContent?.length ?? 0) > 0);
    // MathJax SVG bundle is loaded over CDN and typesets asynchronously.
    await v1Page.waitForTimeout(2500);
    const v1 = await snapRoute(v1Page);
    await v1Ctx.close();

    // ----- v2 -----
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/#/${route}`);
    await page.waitForFunction(() => (document.querySelector('main h2')?.textContent?.length ?? 0) > 0);
    await page.waitForTimeout(2500);
    const v2 = await snapRoute(page);

    // Compare per-selector, per-instance. Any deviation outside TOL fails
    // the test with a precise message naming the route, selector, index,
    // property, and the v1/v2 values.
    for (const sel of SELECTORS) {
      const a = v1[sel];
      const b = v2[sel];
      expect(b.length, `${route} ${sel}: element count v1=${a.length} v2=${b.length}`).toBe(a.length);
      for (let i = 0; i < a.length; i++) {
        const ai = a[i];
        const bi = b[i];
        const numericKeys = ['t', 'l', 'w', 'h'] as const;
        for (const k of numericKeys) {
          const tol = TOL[k];
          expect(
            Math.abs(ai[k] - bi[k]) <= tol,
            `${route} ${sel}[${i}].${k}: v1=${ai[k]} v2=${bi[k]} (tol ±${tol})`,
          ).toBe(true);
        }
        // Foreground / background must match exactly. v1 and v2 both
        // resolve to rgb(...) strings, and a difference here usually means
        // Tailwind preflight stripped a Chrome UA default that v1 relied on
        // (e.g. button bg: #fff → transparent).
        const colorKeys = ['color', 'bg'] as const;
        for (const k of colorKeys) {
          expect(
            bi[k],
            `${route} ${sel}[${i}].${k}: v1=${ai[k]} v2=${bi[k]}`,
          ).toBe(ai[k]);
        }
        const cssKeys = ['fs', 'lh', 'mt', 'mb'] as const;
        for (const k of cssKeys) {
          const tol = TOL[k];
          const av = parseFloat(ai[k]);
          const bv = parseFloat(bi[k]);
          // Some CSS lengths come through as keywords ("normal", "auto") that
          // don't parse to a number. If both sides are the same keyword we
          // accept the match; if they disagree we surface the raw strings.
          if (Number.isNaN(av) && Number.isNaN(bv)) {
            expect(
              ai[k],
              `${route} ${sel}[${i}].${k}: v1="${ai[k]}" v2="${bi[k]}"`,
            ).toBe(bi[k]);
            continue;
          }
          expect(
            Math.abs(av - bv) <= tol,
            `${route} ${sel}[${i}].${k}: v1=${ai[k]} v2=${bi[k]} (tol ±${tol}px)`,
          ).toBe(true);
        }
      }
    }
  });
}
