import { test, expect, type Page } from '@playwright/test';
import v1 from '../fixtures/v1-content.json' with { type: 'json' };

// Strict v1 -> v2 fidelity guard.
//
// Reads the JSON ground truth emitted by `scripts/extract-v1-content.mjs`
// (which itself reads docs/legacy/index.html) and asserts that every label,
// heading, button, paragraph anchor, and select option present in v1 is
// also present in the running v2 build — exact text, no paraphrase.
//
// Unlike tests/e2e/v1-content-fidelity.spec.ts (which uses a hand-curated
// substring whitelist), this file is fully derived from the v1 source.  A
// failure here means v2 drifted from v1, not that someone forgot to update
// a test fixture.
//
// Many assertions are expected to FAIL on the current commit — they are the
// baseline measurement before the fidelity-fix phase.

const BASE_HASH = ''; // the v2 app lives at the root path

async function gotoHash(page: Page, hash: string) {
  // hash arrives as `#/intro` etc. from the v1 fixture; v2 mounts at `/#/intro`.
  await page.goto('/');
  await page.evaluate((h) => {
    location.hash = h;
  }, hash.startsWith('#') ? hash : `#${hash}`);
  await page.waitForFunction(
    () => (document.querySelector('main h2')?.textContent?.length ?? 0) > 0,
  );
}

// v1 paragraphs mix plain Japanese prose with embedded `$...$` / `\(...\)`
// LaTeX and (in intro) `h('strong', ...)` siblings that the extractor drops.
// v2 renders the LaTeX into a typeset span and emits the <strong> children
// inline, so the plain-text fragments BETWEEN those non-string elements
// survive intact in textContent but are not contiguous with each other.
//
// The extractor emits `⁣` (DROPPED_CHILD_MARKER) where it skipped a
// non-string child.  Treat that AND consecutive 2+ spaces as split
// boundaries before asserting.  Returns every prose chunk of >= 8
// characters from a v1 paragraph.
const DROPPED_CHILD_MARKER = '⁣';
function proseChunks(p: string): string[] {
  return p
    .replace(/\\\([^)]*\\\)/g, '$$$$') // normalise \(...\) so we split it too
    .split(/\$[^$]*\$/g)
    .flatMap((s) => s.split(DROPPED_CHILD_MARKER))
    .flatMap((s) => s.split(/ {2,}/g))
    .map((c) => c.replace(/\s+/g, ' ').trim())
    .filter((c) => c.length >= 8)
    .map((c) => c.slice(0, Math.min(c.length, 40)));
}

test.describe('v1 fidelity strict (sidebar)', () => {
  test('sidebar labels match v1 verbatim and in order', async ({ page }) => {
    await gotoHash(page, v1.sidebar.routes[0].hash);
    const nav = page.getByRole('navigation', { name: v1.sidebar.ariaLabel });
    await expect(nav).toBeVisible();

    // Capture v2's rendered link labels (in DOM order) and compare to v1.
    const v2Labels = (await nav.locator('a').allTextContents()).map((s) => s.trim());
    const v1Labels = v1.sidebar.routes.map((r) => r.label);
    expect(v2Labels, 'sidebar labels and order must match v1 exactly').toEqual(v1Labels);
  });

  test('sidebar nav has v1 aria-label', async ({ page }) => {
    await gotoHash(page, v1.sidebar.routes[0].hash);
    // If v2 used the wrong aria-label this locator will fail to find anything.
    await expect(page.getByRole('navigation', { name: v1.sidebar.ariaLabel })).toBeVisible();
  });
});

test.describe('v1 fidelity strict (header)', () => {
  test('header title matches v1', async ({ page }) => {
    await gotoHash(page, v1.sidebar.routes[0].hash);
    await expect(page.locator('header')).toContainText(v1.header.title);
  });
});

// Per-route iteration: headings / paragraphs / buttons / select options.
for (const [key, ex] of Object.entries(v1.examples) as Array<
  [string, (typeof v1.examples)[keyof typeof v1.examples]]
>) {
  test.describe(`v1 fidelity strict (${ex.hash})`, () => {
    test(`${key}: h2 headings present`, async ({ page }) => {
      await gotoHash(page, ex.hash);
      const main = page.locator('main');
      await expect(main).toBeVisible();
      for (const h2 of ex.rendered.h2) {
        // Locate the h2 with exact-name match — paraphrase fails the test.
        await expect(
          main.getByRole('heading', { level: 2, name: h2, exact: true }),
          `${ex.hash} should expose <h2>${h2}</h2>`,
        ).toBeVisible();
      }
    });

    if (ex.rendered.h3.length > 0) {
      test(`${key}: h3 headings present`, async ({ page }) => {
        await gotoHash(page, ex.hash);
        const main = page.locator('main');
        for (const h3 of ex.rendered.h3) {
          await expect(
            main.getByRole('heading', { level: 3, name: h3, exact: true }),
            `${ex.hash} should expose <h3>${h3}</h3>`,
          ).toBeVisible();
        }
      });
    }

    if (ex.rendered.paragraphs.length > 0) {
      test(`${key}: descriptive paragraphs present (substring)`, async ({ page }) => {
        await gotoHash(page, ex.hash);
        const main = page.locator('main');
        for (const p of ex.rendered.paragraphs) {
          for (const chunk of proseChunks(p)) {
            await expect(
              main,
              `${ex.hash} should contain prose chunk "${chunk}"`,
            ).toContainText(chunk);
          }
        }
      });
    }

    if (ex.rendered.buttons.length > 0) {
      test(`${key}: button labels present`, async ({ page }) => {
        await gotoHash(page, ex.hash);
        const main = page.locator('main');
        for (const btn of ex.rendered.buttons) {
          await expect(
            main.getByRole('button', { name: btn, exact: true }),
            `${ex.hash} should expose <button>${btn}</button>`,
          ).toBeVisible();
        }
      });
    }

    if (ex.rendered.selectOptions.length > 0) {
      test(`${key}: select options present`, async ({ page }) => {
        await gotoHash(page, ex.hash);
        const main = page.locator('main');
        // v1's option labels live inside <select>; v2 uses native <select> too.
        for (const opt of ex.rendered.selectOptions) {
          await expect(
            main.locator(`option:has-text("${opt}")`).first(),
            `${ex.hash} should expose <option>${opt}</option>`,
          ).toHaveCount(1);
        }
      });
    }

    if (ex.rendered.code.length > 0) {
      test(`${key}: code blocks present`, async ({ page }) => {
        await gotoHash(page, ex.hash);
        const main = page.locator('main');
        for (const code of ex.rendered.code) {
          // Code block text is preserved across renderers; assert a robust
          // unique snippet (first non-empty line).
          const firstLine = code.split('\n').find((l) => l.trim().length > 0) ?? '';
          if (firstLine.length > 0) {
            await expect(main.locator('pre')).toContainText(firstLine.trim());
          }
        }
      });
    }
  });
}
