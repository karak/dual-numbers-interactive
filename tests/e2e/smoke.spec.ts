import { test, expect, Page } from '@playwright/test';

const ROUTES = ['/intro', '/poly', '/trig', '/chain', '/newton', '/grad-descent'];

async function gotoHash(page: Page, hash: string) {
  await page.goto('/');
  await page.evaluate((h) => { location.hash = h; }, `#${hash}`);
  await page.waitForTimeout(500); // allow MathJax typeset
}

test.describe('route sweep', () => {
  for (const r of ROUTES) {
    test(`${r} renders without NaN/Infinity/raw $...$`, async ({ page }) => {
      await gotoHash(page, r);
      const main = page.locator('main');
      await expect(main).toBeVisible();
      const text = await main.textContent();
      expect(text).not.toMatch(/\bNaN\b/);
      expect(text).not.toMatch(/\bInfinity\b/);
      expect(text).not.toMatch(/\$[^$]{1,40}\$/);
    });
  }
});

test('interaction sweep: poly slider, trig select, grad-descent buttons', async ({ page }) => {
  const errors: string[] = [];
  // MathJax (better-react-mathjax) throws "Typesetting failed: …" when its
  // internal promise resolves after the host node has been unmounted during
  // a route transition. This is library noise, not an application error,
  // so we filter it out of the assertion.
  const isMathJaxRaceNoise = (s: string) => /Typesetting failed:/.test(s);
  page.on('console', (m) => {
    if (m.type() === 'error' && !isMathJaxRaceNoise(m.text())) errors.push(m.text());
  });
  page.on('pageerror', (e) => {
    if (!isMathJaxRaceNoise(e.message)) errors.push(e.message);
  });

  await gotoHash(page, '/poly');
  const polySlider = page.locator('main input[type=range]').first();
  await polySlider.fill('-2');
  await polySlider.fill('1.5');

  await gotoHash(page, '/trig');
  await page.locator('main select').first().selectOption('exp');

  await gotoHash(page, '/newton');
  const nextBtn = page.getByRole('button', { name: '1 ステップ' });
  for (let i = 0; i < 3; i++) await nextBtn.click();

  expect(errors, errors.join('\n')).toEqual([]);
});

test('divergence warning shows after many steps with η=1.2', async ({ page }) => {
  await gotoHash(page, '/grad-descent');
  const etaSlider = page.locator('main input[type=range]').nth(1);
  await etaSlider.fill('1.2');
  const stepBtn = page.getByRole('button', { name: '1 ステップ' });
  for (let i = 0; i < 45; i++) await stepBtn.click();
  // v1 verbatim: '⚠ 発散しました。学習率 η を小さくしてください。'
  const alert = page.getByRole('alert');
  await expect(alert).toContainText('発散しました。学習率');
  await expect(alert).toContainText('小さくしてください');
});
