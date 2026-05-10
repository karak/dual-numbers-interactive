// Browser smoke tests for the dual-numbers demo.
//
// Reusable in two ways:
//   1) Paste each named async function into DevTools console (Chrome/Firefox/Safari)
//      after opening http://localhost:<port>/, then call e.g. `await routeSweep()`.
//   2) Drive via a headless runner — see `tests/run-smoke.mjs` for a Playwright wrapper.
//
// Each test returns a plain object so results are diff-friendly across runs.

export async function runUnitTests() {
  location.hash = '#test';
  await new Promise(r => setTimeout(r, 1500));
  const main = document.getElementById('main');
  const divs = main.querySelectorAll('div');
  const summary = divs[divs.length - 1]?.textContent ?? '';
  const fails = Array.from(divs)
    .filter(d => d.textContent.startsWith('FAIL'))
    .map(d => d.textContent);
  return { summary, fails, totalRows: divs.length };
}

export async function routeSweep() {
  const routes = ['#/intro', '#/poly', '#/trig', '#/chain', '#/newton', '#/grad-descent'];
  const results = [];
  for (const route of routes) {
    location.hash = route;
    await new Promise(r => setTimeout(r, 1500));
    const main = document.getElementById('main');
    const txt = main.textContent;
    const rawDollars = (txt.match(/\$[^$]{1,40}\$/g) ?? []).slice(0, 3);
    results.push({
      route,
      h2: main.querySelector('h2')?.textContent ?? null,
      rawTexLeftover: rawDollars,
      hasNaN: /\bNaN\b/.test(txt),
      hasInfinity: /\bInfinity\b/.test(txt),
      mathjaxSvgs: main.querySelectorAll('mjx-container, svg').length,
    });
  }
  return results;
}

export async function interactionSweep() {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const trigger = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));

  location.hash = '#/poly';
  await sleep(800);
  let s = document.querySelector('#main input[type=range]');
  for (const v of [-3, -1.5, 0, 1.5, 3]) { s.value = v; trigger(s, 'input'); }
  await sleep(300);

  location.hash = '#/trig';
  await sleep(600);
  const sel = document.querySelector('#main select');
  for (const v of ['sin', 'cos', 'exp']) { sel.value = v; trigger(sel, 'change'); await sleep(50); }
  const trigBtns = document.querySelectorAll('#main button');
  trigBtns[0]?.click(); trigBtns[0]?.click(); trigBtns[1]?.click();
  await sleep(300);

  location.hash = '#/chain';
  await sleep(600);
  const sels = document.querySelectorAll('#main select');
  if (sels[0]) { sels[0].value = 'cube'; trigger(sels[0], 'change'); }
  if (sels[1]) { sels[1].value = 'sin'; trigger(sels[1], 'change'); }
  s = document.querySelector('#main input[type=range]');
  s.value = 0.5; trigger(s, 'input'); s.value = 1.8; trigger(s, 'input');
  await sleep(300);

  location.hash = '#/newton';
  await sleep(600);
  const newtBtns = document.querySelectorAll('#main button');
  newtBtns[1]?.click(); newtBtns[2]?.click(); newtBtns[0]?.click();
  await sleep(300);

  location.hash = '#/grad-descent';
  await sleep(600);
  const gradBtns = document.querySelectorAll('#main button');
  gradBtns[1]?.click();
  await sleep(200);

  const main = document.getElementById('main');
  return {
    finalRoute: location.hash,
    bodyHasNaN: /\bNaN\b/.test(main.textContent),
    bodyHasInfinity: /\bInfinity\b/.test(main.textContent),
  };
}

export async function divergenceCheck() {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const trigger = (el, type) => el.dispatchEvent(new Event(type, { bubbles: true }));

  location.hash = '#/intro';
  await sleep(400);
  location.hash = '#/grad-descent';
  await sleep(800);

  const ranges = document.querySelectorAll('#main input[type=range]');
  ranges[1].value = 1.2;
  trigger(ranges[1], 'input');

  const btns = document.querySelectorAll('#main button');
  for (let i = 0; i < 8; i++) btns[1].click();
  await sleep(300);

  return {
    warnText: document.querySelector('#main .warn')?.textContent ?? '',
    lastStep: Array.from(document.querySelectorAll('#main .step-row'))
      .slice(-1)[0]?.textContent.slice(0, 120) ?? '',
  };
}

export async function runAll() {
  const unit = await runUnitTests();
  const routes = await routeSweep();
  const interactions = await interactionSweep();
  const divergence = await divergenceCheck();
  return { unit, routes, interactions, divergence };
}
