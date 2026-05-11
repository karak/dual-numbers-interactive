import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import v1 from '../fixtures/v1-content.json' with { type: 'json' };

// Computed-style audit: open the v1 HTML as a local file AND the v2 dev
// server, then compare key visual properties (font-family family, margins,
// header style, button padding, sidebar font-size, layout grid, panel grid,
// etc.) at corresponding DOM nodes.
//
// Strategy: each test opens v1 in a separate browser context, reads the
// computed style of the target node, closes the context, then opens v2 and
// reads the same property at the v2-equivalent selector.  Comparison uses
// `familyBucket` for font-family (so font-resolution differences don't flake)
// and `expectClose` for numeric pixels (±2px tolerance to absorb sub-pixel
// rounding).
//
// Ground truth = v1 computed style. v1 must NOT be modified.

const here = path.dirname(fileURLToPath(import.meta.url));
const V1_FILE_URL = `file://${path.resolve(here, '..', '..', 'docs/legacy/index.html')}`;

// MathJax in v1 fires async typesetting after DOMContentLoaded; on a
// `file://` load we need to give it a beat.  Heuristic: wait until <main>
// has an <h2>.
async function openV1(page: Page, hash: string) {
  await page.setViewportSize({ width: 1280, height: 720 });
  // Block the MathJax CDN entirely so v1 loads deterministically offline.
  // The audit only inspects layout/font CSS, not typeset SVG output, so
  // MathJax is irrelevant for this test file.
  await page.route('**/mathjax**', (route) => route.abort());
  // Default `waitUntil: 'load'` could otherwise hang on a flaky CDN; with the
  // route abort + `domcontentloaded` we don't depend on the network at all.
  await page.goto(V1_FILE_URL + hash, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => (document.querySelector('main h2')?.textContent?.length ?? 0) > 0,
  );
}

async function openV2(page: Page, hash: string) {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
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

// Numeric px tolerance.  Sub-pixel rounding + font-metric differences mean
// even identical CSS can land within 1–2px of each other at runtime, so we
// accept ±2px by default.
function expectClose(actual: number, expected: number, label: string, tol = 2) {
  expect(
    Math.abs(actual - expected) <= tol,
    `${label}: actual=${actual}px expected≈${expected}px (tol ±${tol}px)`,
  ).toBe(true);
}

// Pick a v1 page selector → computed-style snapshot, plus the same shape
// for v2 (which may use a different but visually-equivalent selector).
async function snapshot(page: Page, selector: string, props: readonly string[]) {
  return await page.locator(selector).first().evaluate(
    (el, ps) => {
      const cs = getComputedStyle(el);
      const out: Record<string, string> = {};
      for (const p of ps as readonly string[]) out[p] = cs.getPropertyValue(p);
      return out;
    },
    props as unknown as string[],
  );
}

// Read both v1 and v2 computed styles for one CSS property bag.  Returns
// `{ v1, v2 }` so the caller asserts on the diff.
async function pairSnapshot(
  browser: import('@playwright/test').Browser,
  page: Page,
  hash: string,
  v1Selector: string,
  v2Selector: string,
  props: readonly string[],
) {
  const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const v1Page = await v1Ctx.newPage();
  await openV1(v1Page, hash);
  const v1Snap = await snapshot(v1Page, v1Selector, props);
  await v1Ctx.close();

  await openV2(page, hash);
  const v2Snap = await snapshot(page, v2Selector, props);

  return { v1: v1Snap, v2: v2Snap };
}

test.describe('v1 -> v2 style audit', () => {
  // ─── original 5 tests (kept for regression coverage) ─────────────────────

  test('main h2 inherits serif body font in both v1 and v2', async ({ page, browser }) => {
    const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const v1Page = await v1Ctx.newPage();
    await openV1(v1Page, '#/intro');
    const v1Font = await v1Page
      .locator('main h2')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);
    await v1Ctx.close();

    await openV2(page, '#/intro');
    const v2Font = await page
      .locator('main h2')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily);

    expect(familyBucket(v1Font), `v1 h2 was "${v1Font}"`).toBe('serif');
    expect(familyBucket(v2Font), `v2 h2 was "${v2Font}" (expected serif like v1)`).toBe('serif');
  });

  test('main paragraphs have non-zero vertical margin in both v1 and v2', async ({
    page,
    browser,
  }) => {
    const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
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
    expect(
      v1Top + v1Bot,
      `v1 paragraph margins (sanity): ${JSON.stringify(v1Margins)}`,
    ).toBeGreaterThan(0);

    const v2Top = parseFloat(v2Margins.marginTop);
    const v2Bot = parseFloat(v2Margins.marginBottom);
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
    for (const [name, expected] of Object.entries(v1.css.tokens)) {
      if (
        ![
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
        ].includes(name)
      ) {
        continue;
      }
      expect(
        v2Tokens[name],
        `v2 should expose CSS custom property ${name} = "${expected}" at :root (got "${v2Tokens[name]}")`,
      ).toBe(expected);
    }
  });

  test('body font-family resolves to serif in both v1 and v2', async ({ page, browser }) => {
    const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
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
    const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
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
    expect(Number(v1Header.fontWeight)).toBeGreaterThanOrEqual(600);
    expect(Number(v2Header.fontWeight)).toBeGreaterThanOrEqual(600);
  });

  // ─── extended audit (new) ────────────────────────────────────────────────

  test('main h2 visual style matches v1 (size, weight, margins)', async ({ page, browser }) => {
    const { v1: a, v2: b } = await pairSnapshot(browser, page, '#/intro', 'main h2', 'main h2', [
      'font-family',
      'font-size',
      'font-weight',
      'margin-top',
      'margin-bottom',
    ]);

    expect(familyBucket(a['font-family']), `v1 h2 font="${a['font-family']}"`).toBe('serif');
    expect(familyBucket(b['font-family']), `v2 h2 font="${b['font-family']}"`).toBe('serif');

    const v1Size = parseFloat(a['font-size']);
    const v2Size = parseFloat(b['font-size']);
    expectClose(v2Size, v1Size, 'h2 font-size');

    // 700 = bold (browser-default for h2)
    expect(Number(a['font-weight']), `v1 h2 weight=${a['font-weight']}`).toBeGreaterThanOrEqual(600);
    expect(Number(b['font-weight']), `v2 h2 weight=${b['font-weight']}`).toBeGreaterThanOrEqual(600);

    // h2 uses `mt-0` in v2 (and v1's first child of <main> is h2 so its
    // margin-top collapses; both sides should report 0).
    expectClose(parseFloat(b['margin-top']), parseFloat(a['margin-top']), 'h2 margin-top');
    expectClose(parseFloat(b['margin-bottom']), parseFloat(a['margin-bottom']), 'h2 margin-bottom');
  });

  test('main h3 visual style matches v1 (size, weight, margins)', async ({ page, browser }) => {
    // intro is the only route with <h3> elements.
    const { v1: a, v2: b } = await pairSnapshot(browser, page, '#/intro', 'main h3', 'main h3', [
      'font-family',
      'font-size',
      'font-weight',
      'margin-top',
      'margin-bottom',
    ]);

    expect(familyBucket(a['font-family']), `v1 h3 font="${a['font-family']}"`).toBe('serif');
    expect(familyBucket(b['font-family']), `v2 h3 font="${b['font-family']}"`).toBe('serif');

    expectClose(parseFloat(b['font-size']), parseFloat(a['font-size']), 'h3 font-size');
    expect(Number(a['font-weight'])).toBeGreaterThanOrEqual(600);
    expect(Number(b['font-weight'])).toBeGreaterThanOrEqual(600);

    expectClose(parseFloat(b['margin-top']), parseFloat(a['margin-top']), 'h3 margin-top');
    expectClose(parseFloat(b['margin-bottom']), parseFloat(a['margin-bottom']), 'h3 margin-bottom');
  });

  test('main p visual style matches v1 (font, line-height, margins, text-align)', async ({
    page,
    browser,
  }) => {
    const { v1: a, v2: b } = await pairSnapshot(browser, page, '#/intro', 'main p', 'main p', [
      'font-family',
      'line-height',
      'margin-top',
      'margin-bottom',
      'text-align',
    ]);

    expect(familyBucket(a['font-family']), `v1 p font="${a['font-family']}"`).toBe('serif');
    expect(familyBucket(b['font-family']), `v2 p font="${b['font-family']}"`).toBe('serif');

    expectClose(parseFloat(b['line-height']), parseFloat(a['line-height']), 'p line-height');

    // v1 paragraphs inherit browser-default <p> margins (~16px top/bottom).
    expectClose(parseFloat(b['margin-top']), parseFloat(a['margin-top']), 'p margin-top');
    expectClose(parseFloat(b['margin-bottom']), parseFloat(a['margin-bottom']), 'p margin-bottom');

    expect(b['text-align'], `v2 p text-align should equal v1 "${a['text-align']}"`).toBe(
      a['text-align'],
    );
  });

  test('main button visual style matches v1 (font, size, padding, border, radius)', async ({
    page,
    browser,
  }) => {
    // newton has visible buttons in v1 and v2: '1 ステップ', '5 ステップ', 'リセット'.
    const { v1: a, v2: b } = await pairSnapshot(
      browser,
      page,
      '#/newton',
      'main button',
      'main button',
      [
        'font-family',
        'font-size',
        'padding-top',
        'padding-right',
        'padding-bottom',
        'padding-left',
        'border-top-width',
        'border-top-style',
        'border-top-color',
        'border-radius',
      ],
    );

    // v1: button { font-family: var(--font-ui); ... } — sans-serif.
    expect(familyBucket(a['font-family']), `v1 button font="${a['font-family']}"`).toBe(
      'sans-serif',
    );
    expect(familyBucket(b['font-family']), `v2 button font="${b['font-family']}"`).toBe(
      'sans-serif',
    );

    expectClose(parseFloat(b['font-size']), parseFloat(a['font-size']), 'button font-size');

    // v1: padding: 6px 12px — top=bottom=6, left=right=12.
    expectClose(parseFloat(b['padding-top']), parseFloat(a['padding-top']), 'button padding-top');
    expectClose(
      parseFloat(b['padding-bottom']),
      parseFloat(a['padding-bottom']),
      'button padding-bottom',
    );
    expectClose(parseFloat(b['padding-left']), parseFloat(a['padding-left']), 'button padding-left');
    expectClose(
      parseFloat(b['padding-right']),
      parseFloat(a['padding-right']),
      'button padding-right',
    );

    // border: 1px solid var(--border).
    expectClose(
      parseFloat(b['border-top-width']),
      parseFloat(a['border-top-width']),
      'button border width',
      1,
    );
    expect(b['border-top-style']).toBe(a['border-top-style']);

    // border-radius: 4px.
    expectClose(
      parseFloat(b['border-radius']),
      parseFloat(a['border-radius']),
      'button border-radius',
    );
  });

  test('main button does not wrap onto two lines (single-line label)', async ({
    page,
    browser,
  }) => {
    // The "1 ステップ" / "10 ステップ" buttons should fit on one line at
    // 1280px viewport.  We compare button height to its font-size: a
    // single-line button height is roughly fontSize * 2.5 (line + padding).
    // A two-line wrap doubles that.

    // v1 baseline
    const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const v1Page = await v1Ctx.newPage();
    await openV1(v1Page, '#/grad-descent');
    const v1Btn = await v1Page
      .locator('main button', { hasText: 'ステップ' })
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { height: el.getBoundingClientRect().height, fontSize: parseFloat(cs.fontSize) };
      });
    await v1Ctx.close();

    await openV2(page, '#/grad-descent');
    const v2Btn = await page
      .locator('main button', { hasText: 'ステップ' })
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { height: el.getBoundingClientRect().height, fontSize: parseFloat(cs.fontSize) };
      });

    // Sanity: v1 button does NOT wrap.
    expect(
      v1Btn.height,
      `v1 'ステップ' button height=${v1Btn.height} (fontSize=${v1Btn.fontSize})`,
    ).toBeLessThan(v1Btn.fontSize * 3);
    // v2 must also not wrap.
    expect(
      v2Btn.height,
      `v2 'ステップ' button wraps onto 2 lines (height=${v2Btn.height}, fontSize=${v2Btn.fontSize}) — likely wrong font-family/size`,
    ).toBeLessThan(v2Btn.fontSize * 3);
  });

  test('sidebar font-family and font-size match v1', async ({ page, browser }) => {
    // v1: aside.sidebar { font-family: var(--font-ui); font-size: 14px }
    // v2: <nav role="navigation" aria-label="例題メニュー">
    const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const v1Page = await v1Ctx.newPage();
    await openV1(v1Page, '#/intro');
    const a = await v1Page
      .locator('aside.sidebar')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { fontFamily: cs.fontFamily, fontSize: cs.fontSize };
      });
    await v1Ctx.close();

    await openV2(page, '#/intro');
    const b = await page
      .getByRole('navigation', { name: v1.sidebar.ariaLabel })
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return { fontFamily: cs.fontFamily, fontSize: cs.fontSize };
      });

    expect(familyBucket(a.fontFamily)).toBe('sans-serif');
    expect(familyBucket(b.fontFamily)).toBe('sans-serif');
    expectClose(parseFloat(b.fontSize), parseFloat(a.fontSize), 'sidebar font-size');
  });

  test('sidebar link visual style matches v1 (display, padding, text-decoration)', async ({
    page,
    browser,
  }) => {
    // v1: aside.sidebar a { display:block; padding:8px 12px; text-decoration:none; ... }
    const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const v1Page = await v1Ctx.newPage();
    await openV1(v1Page, '#/intro');
    const a = await v1Page
      .locator('aside.sidebar a')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          display: cs.display,
          paddingTop: cs.paddingTop,
          paddingRight: cs.paddingRight,
          paddingBottom: cs.paddingBottom,
          paddingLeft: cs.paddingLeft,
          lineHeight: cs.lineHeight,
          height: el.getBoundingClientRect().height,
          textDecoration: cs.textDecorationLine,
        };
      });
    await v1Ctx.close();

    await openV2(page, '#/intro');
    const b = await page
      .getByRole('navigation', { name: v1.sidebar.ariaLabel })
      .locator('a')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          display: cs.display,
          paddingTop: cs.paddingTop,
          paddingRight: cs.paddingRight,
          paddingBottom: cs.paddingBottom,
          paddingLeft: cs.paddingLeft,
          lineHeight: cs.lineHeight,
          height: el.getBoundingClientRect().height,
          textDecoration: cs.textDecorationLine,
        };
      });

    expect(b.display, 'sidebar link display').toBe(a.display);
    expectClose(parseFloat(b.paddingTop), parseFloat(a.paddingTop), 'sidebar link padding-top');
    expectClose(
      parseFloat(b.paddingBottom),
      parseFloat(a.paddingBottom),
      'sidebar link padding-bottom',
    );
    expectClose(parseFloat(b.paddingLeft), parseFloat(a.paddingLeft), 'sidebar link padding-left');
    expectClose(
      parseFloat(b.paddingRight),
      parseFloat(a.paddingRight),
      'sidebar link padding-right',
    );
    // v1 sidebar inherits body line-height 1.6 → 22.4px at 14px. Tailwind's
    // default `text-sm` sets line-height: 1.25rem (20px), shrinking each
    // sidebar item by ~2.4px — compounds to a visible vertical-rhythm shift.
    expectClose(parseFloat(b.lineHeight), parseFloat(a.lineHeight), 'sidebar link line-height');
    expectClose(b.height, a.height, 'sidebar link height');
    expect(b.textDecoration, 'sidebar link text-decoration').toBe(a.textDecoration);
  });

  test('active sidebar link background matches v1 (--accent-soft)', async ({ page, browser }) => {
    // v1: aside.sidebar a.active { background: var(--accent-soft); ... }
    // The currently-active route is the one we navigated to (#/intro).
    const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const v1Page = await v1Ctx.newPage();
    await openV1(v1Page, '#/intro');
    const aBg = await v1Page
      .locator('aside.sidebar a.active')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    await v1Ctx.close();

    await openV2(page, '#/intro');
    const bBg = await page
      .getByRole('navigation', { name: v1.sidebar.ariaLabel })
      .locator('a[aria-current="page"], a.active')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    // Both should resolve to a non-transparent colour derived from
    // --accent-soft (#ede9ff).  We compare normalised rgb() strings.
    expect(bBg, `v2 active sidebar background ${bBg} vs v1 ${aBg}`).toBe(aBg);
  });

  test('layout grid matches v1 (columns, max-width, gap, padding)', async ({ page, browser }) => {
    // v1: .layout { display:grid; grid-template-columns: 240px 1fr; max-width: 1200px; gap: 16px; padding: 16px }
    // v2: the .layout-equivalent is the wrapping <div> in Layout.tsx (sibling of <header>).
    const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const v1Page = await v1Ctx.newPage();
    await openV1(v1Page, '#/intro');
    const a = await v1Page
      .locator('.layout')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          display: cs.display,
          gridTemplateColumns: cs.gridTemplateColumns,
          maxWidth: cs.maxWidth,
          columnGap: cs.columnGap,
          rowGap: cs.rowGap,
          paddingTop: cs.paddingTop,
          paddingRight: cs.paddingRight,
          paddingBottom: cs.paddingBottom,
          paddingLeft: cs.paddingLeft,
        };
      });
    await v1Ctx.close();

    await openV2(page, '#/intro');
    // v2 layout container = parent <div> of <main>.  Locate <main> and walk up.
    const b = await page
      .locator('main')
      .first()
      .evaluate((el) => {
        const layoutDiv = el.parentElement!;
        const cs = getComputedStyle(layoutDiv);
        return {
          display: cs.display,
          gridTemplateColumns: cs.gridTemplateColumns,
          maxWidth: cs.maxWidth,
          columnGap: cs.columnGap,
          rowGap: cs.rowGap,
          paddingTop: cs.paddingTop,
          paddingRight: cs.paddingRight,
          paddingBottom: cs.paddingBottom,
          paddingLeft: cs.paddingLeft,
        };
      });

    expect(b.display, 'layout display').toBe(a.display);

    // grid-template-columns is the load-bearing one ('240px 1fr' on
    // >=1100px viewports).  Compare the resolved track sizes within ±2px.
    const v1Cols = a.gridTemplateColumns.split(/\s+/).map((p) => parseFloat(p));
    const v2Cols = b.gridTemplateColumns.split(/\s+/).map((p) => parseFloat(p));
    expect(
      v2Cols.length,
      `layout grid-template-columns: v2="${b.gridTemplateColumns}" v1="${a.gridTemplateColumns}"`,
    ).toBe(v1Cols.length);
    for (let i = 0; i < v1Cols.length; i++) {
      expectClose(v2Cols[i], v1Cols[i], `layout grid column[${i}]`);
    }

    expectClose(parseFloat(b.maxWidth), parseFloat(a.maxWidth), 'layout max-width');
    expectClose(parseFloat(b.columnGap), parseFloat(a.columnGap), 'layout column-gap');
    expectClose(parseFloat(b.rowGap), parseFloat(a.rowGap), 'layout row-gap');
    expectClose(parseFloat(b.paddingTop), parseFloat(a.paddingTop), 'layout padding-top');
    expectClose(parseFloat(b.paddingLeft), parseFloat(a.paddingLeft), 'layout padding-left');
    expectClose(parseFloat(b.paddingRight), parseFloat(a.paddingRight), 'layout padding-right');
    expectClose(parseFloat(b.paddingBottom), parseFloat(a.paddingBottom), 'layout padding-bottom');
  });

  test('.panel grid matches v1 (1fr 600px, gap 16px) on Polynomial', async ({ page, browser }) => {
    // v1: .panel { grid-template-columns: 1fr 600px; gap: 16px }
    // v2: the equivalent wrapper inside <article> on Polynomial/Trig/Chain.
    const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const v1Page = await v1Ctx.newPage();
    await openV1(v1Page, '#/poly');
    const a = await v1Page
      .locator('.panel')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          display: cs.display,
          gridTemplateColumns: cs.gridTemplateColumns,
          columnGap: cs.columnGap,
        };
      });
    await v1Ctx.close();

    await openV2(page, '#/poly');
    // v2 panel = direct child of <article> with grid styles.
    const b = await page
      .locator('main article > div.grid')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          display: cs.display,
          gridTemplateColumns: cs.gridTemplateColumns,
          columnGap: cs.columnGap,
        };
      });

    expect(b.display, 'panel display').toBe(a.display);

    const v1Cols = a.gridTemplateColumns.split(/\s+/).map((p) => parseFloat(p));
    const v2Cols = b.gridTemplateColumns.split(/\s+/).map((p) => parseFloat(p));
    expect(
      v2Cols.length,
      `panel grid-template-columns: v2="${b.gridTemplateColumns}" v1="${a.gridTemplateColumns}"`,
    ).toBe(v1Cols.length);
    for (let i = 0; i < v1Cols.length; i++) {
      expectClose(v2Cols[i], v1Cols[i], `panel grid column[${i}]`);
    }
    expectClose(parseFloat(b.columnGap), parseFloat(a.columnGap), 'panel column-gap');
  });

  test('main padding matches v1 (24px all sides)', async ({ page, browser }) => {
    // v1: main.main { padding: var(--pad) } where --pad = 24px.
    const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const v1Page = await v1Ctx.newPage();
    await openV1(v1Page, '#/intro');
    const a = await v1Page
      .locator('main')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          paddingTop: cs.paddingTop,
          paddingRight: cs.paddingRight,
          paddingBottom: cs.paddingBottom,
          paddingLeft: cs.paddingLeft,
          minHeight: cs.minHeight,
          borderRadius: cs.borderTopLeftRadius,
        };
      });
    await v1Ctx.close();

    await openV2(page, '#/intro');
    const b = await page
      .locator('main')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          paddingTop: cs.paddingTop,
          paddingRight: cs.paddingRight,
          paddingBottom: cs.paddingBottom,
          paddingLeft: cs.paddingLeft,
          minHeight: cs.minHeight,
          borderRadius: cs.borderTopLeftRadius,
        };
      });

    expectClose(parseFloat(b.paddingTop), parseFloat(a.paddingTop), 'main padding-top');
    expectClose(parseFloat(b.paddingRight), parseFloat(a.paddingRight), 'main padding-right');
    expectClose(parseFloat(b.paddingBottom), parseFloat(a.paddingBottom), 'main padding-bottom');
    expectClose(parseFloat(b.paddingLeft), parseFloat(a.paddingLeft), 'main padding-left');
    expectClose(parseFloat(b.minHeight), parseFloat(a.minHeight), 'main min-height');
    expectClose(parseFloat(b.borderRadius), parseFloat(a.borderRadius), 'main border-radius');
  });

  test('header padding matches v1 (16px 24px)', async ({ page, browser }) => {
    // v1: header.app-header { padding: 16px 24px }
    const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const v1Page = await v1Ctx.newPage();
    await openV1(v1Page, '#/intro');
    const a = await v1Page
      .locator('header')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          paddingTop: cs.paddingTop,
          paddingRight: cs.paddingRight,
          paddingBottom: cs.paddingBottom,
          paddingLeft: cs.paddingLeft,
        };
      });
    await v1Ctx.close();

    await openV2(page, '#/intro');
    const b = await page
      .locator('header')
      .first()
      .evaluate((el) => {
        const cs = getComputedStyle(el);
        return {
          paddingTop: cs.paddingTop,
          paddingRight: cs.paddingRight,
          paddingBottom: cs.paddingBottom,
          paddingLeft: cs.paddingLeft,
        };
      });

    expectClose(parseFloat(b.paddingTop), parseFloat(a.paddingTop), 'header padding-top');
    expectClose(parseFloat(b.paddingRight), parseFloat(a.paddingRight), 'header padding-right');
    expectClose(parseFloat(b.paddingBottom), parseFloat(a.paddingBottom), 'header padding-bottom');
    expectClose(parseFloat(b.paddingLeft), parseFloat(a.paddingLeft), 'header padding-left');
  });

  // Regression guard: v1 main-area labels (slider labels, select labels) have
  // no font-family override, so they inherit body's `var(--font-body)` which
  // is serif. A common v2 mistake is to slap `[font-family:var(--font-ui)]`
  // on the wrapper div / <label> for a "UI feel", which silently turns the
  // Japanese label text sans-serif. This test bucket-compares both sides.
  test('main label font-family inherits body serif (slider + select labels)', async ({
    page,
    browser,
  }) => {
    // grad-descent exposes both slider labels ("初期値 x_0", "学習率 η") and
    // is therefore the easiest single route to audit. We pick the first
    // <label> inside <main> — both v1 and v2 render it as the x_0 slider.
    const { v1: a, v2: b } = await pairSnapshot(
      browser,
      page,
      '#/grad-descent',
      'main label',
      'main label',
      ['font-family'],
    );

    expect(familyBucket(a['font-family']), `v1 label font="${a['font-family']}"`).toBe('serif');
    expect(familyBucket(b['font-family']), `v2 label font="${b['font-family']}"`).toBe('serif');
  });
});
