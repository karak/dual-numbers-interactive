import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * Step 5 of the v1-faithful rewrite plan
 * (.claude/plans/rustling-swinging-crescent.md).
 *
 * Single thin equality test:
 *   - Open v1 from file:// (with MathJax CDN active — no route abort)
 *   - Open v2 from the Playwright web server
 *   - DOM-walk both, starting from <body>'s element children for v1 and
 *     #root's element children for v2 (so React's invisible root wrapper
 *     is the only structural difference that the comparison tolerates)
 *   - For every element at the same nth-of-type path:
 *     - All getComputedStyle properties must match
 *     - All attributes must match
 *     - All four bounding-rect numbers must match within ±2px
 *
 * No waiver / manifest table — drift is drift. If a deviation is truly
 * unavoidable the right fix is in the source (use v1's class names,
 * v1's structure, v1's CSS), not in this test.
 *
 * Two narrow blanket skips that are NOT waivers but acknowledgements that
 * the equality model itself doesn't apply:
 *   - mjx-container's SVG descendants: MathJax generates anonymous <g>,
 *     <path>, <use>, <defs> elements with auto-generated ids; comparing
 *     the SVG internals is meaningless once the outer mjx-container
 *     matches. We compare mjx-container itself, not what it owns.
 *   - <canvas> bitmap: pixel content is dynamic per draw; we compare the
 *     canvas element box and attributes, not the rendered raster.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const V1_URL = `file://${path.resolve(here, '..', '..', 'docs/legacy/index.html')}`;
const ROUTES = ['intro', 'poly', 'trig', 'chain', 'newton', 'grad-descent'] as const;

interface Snap {
  path: string;
  tag: string;
  attrs: Record<string, string>;
  style: Record<string, string>;
  geometry: { t: number; l: number; w: number; h: number };
}

async function walkRoot(page: import('@playwright/test').Page): Promise<Snap[]> {
  return await page.evaluate(() => {
    // Walk only the app shell: header.app-header + div.layout. Both v1 and
    // v2 mount these. Everything else under <body> (v1: inline <script>s;
    // v2: React's #root wrapper-itself, MathJax's global font-cache <svg>,
    // Vite's dev-client script) is runtime noise outside the app's visible
    // surface and is excluded.
    const header = document.querySelector('body header.app-header');
    const layout = document.querySelector('body .layout');
    const startNodes: Element[] = [];
    if (header) startNodes.push(header);
    if (layout) startNodes.push(layout);

    const out: Array<Snap> = [];

    function walk(el: Element, parentPath: string) {
      const tag = el.tagName.toLowerCase();
      const sameTag = Array.from(el.parentElement?.children ?? []).filter(
        (s) => s.tagName === el.tagName,
      );
      const nth = sameTag.indexOf(el) + 1;
      const segment = sameTag.length > 1 ? `${tag}:nth-of-type(${nth})` : tag;
      const myPath = parentPath ? `${parentPath} > ${segment}` : segment;

      const cs = getComputedStyle(el);
      const style: Record<string, string> = {};
      for (let i = 0; i < cs.length; i++) {
        const k = cs[i];
        style[k] = cs.getPropertyValue(k);
      }
      const attrs: Record<string, string> = {};
      for (const a of el.attributes) attrs[a.name] = a.value;

      const rect = el.getBoundingClientRect();
      out.push({
        path: myPath,
        tag,
        attrs,
        style,
        geometry: {
          t: Math.round(rect.top * 10) / 10,
          l: Math.round(rect.left * 10) / 10,
          w: Math.round(rect.width * 10) / 10,
          h: Math.round(rect.height * 10) / 10,
        },
      });

      // MathJax's SVG descendants are auto-generated; we compare the
      // mjx-container itself but not its internals.
      if (tag === 'mjx-container') return;

      for (const child of Array.from(el.children)) walk(child, myPath);
    }

    for (const node of startNodes) walk(node, '');
    return out;
  });
}

const PX_TOL = 2;

function approxEqualNumeric(a: string, b: string): boolean {
  const an = parseFloat(a);
  const bn = parseFloat(b);
  if (!Number.isFinite(an) || !Number.isFinite(bn)) return false;
  return Math.abs(an - bn) <= PX_TOL;
}

// Attribute keys whose VALUES are framework-generated identifiers — the
// PRESENCE of the attribute and its LINKAGE (label[for] resolves to a real
// input[id]) is what matters; the literal string is not visible to the user.
//
// - id / for: v1 uses a global `__sliderSeq` counter (slider-1, trig-fn-2,
//   chain-inner-1, ...). v2 uses React's useId (':r1:', ':r2:', ...). Both
//   produce unique values but the strings necessarily differ. The linkage
//   `<label for="X">` ↔ `<input id="X">` is verified separately below so
//   we still catch any broken pairing.
// - ctxtmenu_counter: MathJax-internal monotonic counter for context-menu
//   attachment order. Depends on the order in which MathJax encountered
//   each container during typeset; differs because v2's MathJax is loaded
//   dynamically (after React's first render) while v1's is loaded
//   synchronously in <head>. Not user-visible.
const IGNORE_ATTR_VALUES = new Set(['id', 'for', 'ctxtmenu_counter']);

function diffSnap(v1: Snap, v2: Snap): string[] {
  const diffs: string[] = [];
  // Style
  for (const k of Object.keys(v1.style)) {
    const a = v1.style[k];
    const b = v2.style[k];
    if (a === b) continue;
    if (approxEqualNumeric(a, b)) continue;
    diffs.push(`${v1.path} > css.${k}: v1='${a}' v2='${b}'`);
  }
  for (const k of Object.keys(v2.style)) {
    if (!(k in v1.style)) diffs.push(`${v1.path} > css.${k}: missing in v1, v2='${v2.style[k]}'`);
  }
  // Attributes: presence must match; values must match except for known
  // framework-generated identifiers.
  for (const k of Object.keys(v1.attrs)) {
    const inV2 = k in v2.attrs;
    if (!inV2) {
      diffs.push(`${v1.path} > attr.${k}: v1='${v1.attrs[k]}' v2=(absent)`);
      continue;
    }
    if (IGNORE_ATTR_VALUES.has(k)) continue;
    if (v2.attrs[k] !== v1.attrs[k]) {
      diffs.push(`${v1.path} > attr.${k}: v1='${v1.attrs[k]}' v2='${v2.attrs[k]}'`);
    }
  }
  for (const k of Object.keys(v2.attrs)) {
    if (!(k in v1.attrs)) diffs.push(`${v1.path} > attr.${k}: missing in v1, v2='${v2.attrs[k]}'`);
  }
  // Geometry
  for (const k of ['t', 'l', 'w', 'h'] as const) {
    const a = v1.geometry[k];
    const b = v2.geometry[k];
    if (Math.abs(a - b) > PX_TOL) {
      diffs.push(`${v1.path} > rect.${k}: v1=${a} v2=${b}`);
    }
  }
  return diffs;
}

// Auxiliary check on top of byte equality: each <label for="X"> must
// resolve to an existing element with id="X". This compensates for the
// IGNORE_ATTR_VALUES entry on id/for — it preserves the semantic
// invariant (pairing) that the literal string check would otherwise miss.
async function verifyLabelInputLinkage(
  page: import('@playwright/test').Page,
  side: 'v1' | 'v2',
): Promise<string[]> {
  return await page.evaluate(
    (side: string) => {
      const problems: string[] = [];
      document.querySelectorAll('label[for]').forEach((label) => {
        const id = label.getAttribute('for');
        if (id && !document.getElementById(id)) {
          problems.push(`${side}: <label for="${id}"> has no matching id in DOM`);
        }
      });
      return problems;
    },
    side as string,
  );
}

test.describe.configure({ mode: 'serial' });

for (const route of ROUTES) {
  test(`v1↔v2 byte-equality @ #/${route}`, async ({ page, browser }) => {
    // ----- v1 -----
    const v1Ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const v1Page = await v1Ctx.newPage();
    await v1Page.goto(`${V1_URL}#/${route}`, { waitUntil: 'networkidle' });
    await v1Page.waitForFunction(
      () => (document.querySelector('main h2')?.textContent?.length ?? 0) > 0,
    );
    await v1Page.waitForTimeout(2500); // MathJax CDN typesetting
    const v1Snaps = await walkRoot(v1Page);
    const v1LinkageProblems = await verifyLabelInputLinkage(v1Page, 'v1');
    await v1Ctx.close();

    // ----- v2 -----
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/#/${route}`);
    await page.waitForFunction(
      () => (document.querySelector('main h2')?.textContent?.length ?? 0) > 0,
    );
    await page.waitForTimeout(2500);
    const v2Snaps = await walkRoot(page);
    const v2LinkageProblems = await verifyLabelInputLinkage(page, 'v2');

    const v1ByPath = new Map(v1Snaps.map((s) => [s.path, s]));
    const v2ByPath = new Map(v2Snaps.map((s) => [s.path, s]));

    const diffs: string[] = [];
    for (const [path, v1s] of v1ByPath) {
      const v2s = v2ByPath.get(path);
      if (!v2s) {
        diffs.push(`STRUCTURE: ${path} missing in v2 (v1 tag=${v1s.tag})`);
        continue;
      }
      diffs.push(...diffSnap(v1s, v2s));
    }
    for (const [path, v2s] of v2ByPath) {
      if (!v1ByPath.has(path)) {
        diffs.push(`STRUCTURE: ${path} extra in v2 (v2 tag=${v2s.tag})`);
      }
    }

    const linkageProblems = [...v1LinkageProblems, ...v2LinkageProblems];

    if (diffs.length > 0 || linkageProblems.length > 0) {
      console.log(`\n=== ${route}: ${diffs.length} diffs + ${linkageProblems.length} linkage problems ===`);
      for (const p of linkageProblems) console.log('  ' + p);
      for (const d of diffs.slice(0, 60)) console.log('  ' + d);
      if (diffs.length > 60) console.log(`  ... ${diffs.length - 60} more`);
    }
    expect(
      diffs.length,
      `${route}: ${diffs.length} v1↔v2 byte differences (see test log)`,
    ).toBe(0);
    expect(
      linkageProblems.length,
      `${route}: ${linkageProblems.length} label/input linkage problems (see test log)`,
    ).toBe(0);
  });
}
