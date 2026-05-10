// Headless runner for tests/browser-smoke.mjs using Playwright.
//
// Prerequisites:
//   npm i -D playwright
//   npx playwright install chromium
//   python3 -m http.server 8000   # in repo root, in another terminal
//
// Run:
//   node tests/run-smoke.mjs                  # default port 8000
//   PORT=8765 node tests/run-smoke.mjs        # custom port
//
// Exits non-zero on any failure (NaN/Infinity rendered, console errors, raw $...$ leftover, etc.).

import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const PORT = process.env.PORT ?? '8000';
const URL = `http://localhost:${PORT}/`;
const here = dirname(fileURLToPath(import.meta.url));
const smokeSource = readFileSync(join(here, 'browser-smoke.mjs'), 'utf8');

const browser = await chromium.launch();
const page = await browser.newPage();

const consoleErrors = [];
page.on('console', m => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', err => consoleErrors.push(`pageerror: ${err.message}`));

await page.goto(URL, { waitUntil: 'domcontentloaded' });

const results = await page.evaluate(async (src) => {
  const blob = new Blob([src], { type: 'text/javascript' });
  const mod = await import(URL.createObjectURL(blob));
  return mod.runAll();
}, smokeSource);

await browser.close();

let failed = false;
const fail = (msg) => { console.error('FAIL:', msg); failed = true; };

if (!results.unit.summary.includes('passed, 0 failed')) fail(`unit: ${results.unit.summary}`);
if (results.unit.fails.length) fail(`unit fails: ${JSON.stringify(results.unit.fails)}`);

for (const r of results.routes) {
  if (r.hasNaN) fail(`${r.route} contains NaN`);
  if (r.hasInfinity) fail(`${r.route} contains Infinity`);
  if (r.rawTexLeftover.length) fail(`${r.route} has unrendered LaTeX: ${r.rawTexLeftover.join(', ')}`);
}

if (results.interactions.bodyHasNaN) fail('interactionSweep produced NaN');
if (results.interactions.bodyHasInfinity) fail('interactionSweep produced Infinity');

if (!results.divergence.warnText.includes('発散')) fail(`divergence warning did not appear: ${JSON.stringify(results.divergence)}`);

if (consoleErrors.length) fail(`console errors: ${consoleErrors.join(' | ')}`);

console.log(JSON.stringify(results, null, 2));
process.exit(failed ? 1 : 0);
