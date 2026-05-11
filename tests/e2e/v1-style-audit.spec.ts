import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import v1 from '../fixtures/v1-content.json' with { type: 'json' };

// Computed-style audit: open the v1 HTML as a local file AND the v2 dev
// server, then compare key visual properties (font-family family, margins,
// header style) at corresponding DOM nodes.
//
// These tests are intentionally written to FAIL on the current commit:
// they capture the *visual drift* between v1 and v2 (serif vs sans heading,
// no paragraph spacing, etc.) so the fidelity-fix phase has a concrete
// before/after.  Once v2 catches up, they pass.

const here = path.dirname(fileURLToPath(import.meta.url));
const V1_FILE_URL = `file://${path.resolve(here, '..', '..', 'docs/legacy/index.html')}`;

// MathJax in v1 fires async typesetting after DOMContentLoaded; on a
// `file://` load we need to give it a beat.  Heuristic: wait until <main>
// has an <h2>.
async function openV1(page: Page, hash: string) {
  await page.goto(V1_FILE_URL + hash);
  await page.waitForFunction(
    () => (document.querySelector('main h2')?.textContent?.length ?? 0) > 0,
  );
}

async function openV2(page: Page, hash: string) {
  await page.goto('/');
  await page.evaluate((h) => {
    location.hash = h;
  }, hash);
  await page.waitForFunction(
    () => (document.querySelector('main h2')?.textContent?.length ?? 0) > 0,
  );
}

// Take a font-family CSS string ("'Noto Serif JP', Georgia, serif") and
// reduce it to a coarse family bucket — "serif" | "sans-serif" | "monospace"
// | "other" — so we can compare without flaking on font-resolution details.
function familyBucket(font: string): 'serif' | 'sans-serif' | 'monospace' | 'other' {
  const f = font.toLowerCase();
  if (f.includes('monospace') || f.includes('menlo') || f.includes('mono')) return 'monospace';
  if (f.includes('sans-serif') || f.includes('-apple-system') || f.includes('hiragino sans')) {
    return 'sans-serif';
  }
  if (f.includes('serif') || f.includes('georgia') || f.includes('noto serif')) return 'serif';
  return 'other';
}

test.describe('v1 -> v2 style audit', () => {
  test('main h2 inherits serif body font in both v1 and v2', async ({ page, browser }) => {
    // v1 reference
    const v1Ctx = await browser.newContext();
    const v1Page = await v1Ctx.newPage();
    await openV1(v1Page, '#/intro');
    const v1Font = await v1Page
      .locator('main h2')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    await v1Ctx.close();

    // v2 under test
    await openV2(page, '#/intro');
    const v2Font = await page
      .locator('main h2')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);

    // v1 baseline expectation (sanity check on the v1 read itself).
    expect(familyBucket(v1Font), `v1 h2 was "${v1Font}"`).toBe('serif');

    // v2 should match the v1 family bucket. Currently v2 force-applies
    // `font-[var(--font-ui)]` (sans-serif) to every h2/h3 — this test
    // captures that regression.
    expect(familyBucket(v2Font), `v2 h2 was "${v2Font}" (expected serif like v1)`).toBe('serif');
  });

  test('main paragraphs have non-zero vertical margin in both v1 and v2', async ({
    page,
    browser,
  }) => {
    const v1Ctx = await browser.newContext();
    const v1Page = await v1Ctx.newPage();
    await openV1(v1Page, '#/intro');
    const v1Margins = await v1Page
      .locator('main p')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { marginTop: cs.marginTop, marginBottom: cs.marginBottom };
      });
    await v1Ctx.close();

    await openV2(page, '#/intro');
    const v2Margins = await page
      .locator('main p')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { marginTop: cs.marginTop, marginBottom: cs.marginBottom };
      });

    const v1Top = parseFloat(v1Margins.marginTop);
    const v1Bot = parseFloat(v1Margins.marginBottom);
    expect(v1Top + v1Bot, `v1 paragraph margins (sanity): ${JSON.stringify(v1Margins)}`).toBeGreaterThan(0);

    const v2Top = parseFloat(v2Margins.marginTop);
    const v2Bot = parseFloat(v2Margins.marginBottom);
    // v2's Tailwind preflight resets <p> margins to 0 unless `prose` is
    // honoured (which requires @tailwindcss/typography — not installed).
    expect(
      v2Top + v2Bot,
      `v2 paragraphs should have non-zero spacing like v1 (got ${JSON.stringify(v2Margins)})`,
    ).toBeGreaterThan(0);
  });

  test('css custom properties match v1 token catalogue', async ({ page }) => {
    await openV2(page, '#/intro');
    const v2Tokens = await page.evaluate(() => {
      const cs = getComputedStyle(document.documentElement);
      const out: Record<string, string> = {};
      // Pull every --xxx token we care about from the v1 manifest.  The list
      // is the *names* — values come from v1 fixture.
      const names = [
        '--bg',
        '--surface',
        '--ink',
        '--ink-soft',
        '--border',
        '--accent',
        '--accent-soft',
        '--curve',
        '--tangent',
        '--ghost',
        '--font-body',
        '--font-ui',
        '--font-mono',
      ];
      for (const n of names) out[n] = cs.getPropertyValue(n).trim();
      return out;
    });
    // v1 declares tokens directly on :root.  v2 declares them under a
    // Tailwind @theme block with `--color-*` prefixes — so the bare names
    // resolve to '' in v2.  This assertion captures that drift.
    for (const [name, expected] of Object.entries(v1.css.tokens)) {
      if (!['--bg', '--surface', '--ink', '--ink-soft', '--border', '--accent', '--accent-soft', '--curve', '--tangent', '--ghost', '--font-body', '--font-ui', '--font-mono'].includes(name)) {
        continue;
      }
      expect(
        v2Tokens[name],
        `v2 should expose CSS custom property ${name} = "${expected}" at :root (got "${v2Tokens[name]}")`,
      ).toBe(expected);
    }
  });

  test('body font-family resolves to serif in both v1 and v2', async ({ page, browser }) => {
    const v1Ctx = await browser.newContext();
    const v1Page = await v1Ctx.newPage();
    await openV1(v1Page, '#/intro');
    const v1Body = await v1Page.evaluate(() => getComputedStyle(document.body).fontFamily);
    await v1Ctx.close();

    await openV2(page, '#/intro');
    const v2Body = await page.evaluate(() => getComputedStyle(document.body).fontFamily);

    expect(familyBucket(v1Body), `v1 body font was "${v1Body}"`).toBe('serif');
    expect(familyBucket(v2Body), `v2 body font was "${v2Body}"`).toBe('serif');
  });

  test('header style matches v1 (sans-serif UI font, semibold)', async ({ page, browser }) => {
    const v1Ctx = await browser.newContext();
    const v1Page = await v1Ctx.newPage();
    await openV1(v1Page, '#/intro');
    const v1Header = await v1Page
      .locator('header')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { fontFamily: cs.fontFamily, fontWeight: cs.fontWeight };
      });
    await v1Ctx.close();

    await openV2(page, '#/intro');
    const v2Header = await page
      .locator('header')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { fontFamily: cs.fontFamily, fontWeight: cs.fontWeight };
      });

    expect(familyBucket(v1Header.fontFamily)).toBe('sans-serif');
    expect(familyBucket(v2Header.fontFamily)).toBe('sans-serif');
    // 600 (semibold) — accept any value that parses to >= 600.
    expect(Number(v1Header.fontWeight)).toBeGreaterThanOrEqual(600);
    expect(Number(v2Header.fontWeight)).toBeGreaterThanOrEqual(600);
  });
});
