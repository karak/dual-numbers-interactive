#!/usr/bin/env node
/*
 * Step 4 guard #2 + C4 fix (.claude/plans/rustling-swinging-crescent.md).
 *
 * Two integrity layers:
 *
 *   (a) SHA-256 of docs/legacy/index.html must match scripts/v1.sha256.
 *       v1 is the source of truth — any edit to it must be deliberate and
 *       reviewable. The pin is a one-line file; updating it shows up as an
 *       explicit diff line that the reviewer cannot miss.
 *
 *   (b) After integrity passes, the <style> block at docs/legacy/index.html:
 *       L15-49 (4-space HTML indent stripped) must appear verbatim inside
 *       src/index.css. A literal substring check is the strictest form of
 *       "v1 rules are present unchanged".
 *
 * Both checks read paths from env so tests can point at fixtures:
 *   V1_PATH         (default docs/legacy/index.html)
 *   V1_SHA256_PATH  (default scripts/v1.sha256)
 *   V2_CSS_PATH     (default src/index.css)
 *
 * Failure mode: prints diagnostic info and exits 1.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const V1_PATH = process.env.V1_PATH ?? 'docs/legacy/index.html';
const V1_SHA256_PATH = process.env.V1_SHA256_PATH ?? 'scripts/v1.sha256';
const V2_CSS_PATH = process.env.V2_CSS_PATH ?? 'src/index.css';

// L15-49 inclusive (1-indexed).
const V1_START_LINE = 15;
const V1_END_LINE = 49;

// ---- (a) Integrity guard: v1 must match its pinned SHA-256 ----

if (!existsSync(V1_SHA256_PATH)) {
  console.error(
    `check-v1-css-subset: FAIL — pin file ${V1_SHA256_PATH} is missing. ` +
      `Did you delete it intentionally? Re-create with:\n  shasum -a 256 ${V1_PATH} > ${V1_SHA256_PATH}`,
  );
  process.exit(1);
}

const expectedPin = readFileSync(V1_SHA256_PATH, 'utf8').trim().split(/\s+/)[0];
const v1Bytes = readFileSync(V1_PATH);
const actualPin = createHash('sha256').update(v1Bytes).digest('hex');

if (expectedPin !== actualPin) {
  console.error(
    `check-v1-css-subset: FAIL — v1 integrity check failed.\n` +
      `  ${V1_PATH}\n` +
      `    expected sha256: ${expectedPin}\n` +
      `    actual   sha256: ${actualPin}\n` +
      `\n` +
      `v1 has been modified. This is a two-step ceremony:\n` +
      `  1. Decide whether the v1 edit is intentional.\n` +
      `  2. If yes, update ${V1_SHA256_PATH} in a SEPARATE commit so the\n` +
      `     pin change is reviewable on its own.`,
  );
  process.exit(1);
}

// ---- (b) v1 <style> block must appear verbatim in v2 CSS ----

const v1Html = v1Bytes.toString('utf8');
const v1Lines = v1Html.split('\n').slice(V1_START_LINE - 1, V1_END_LINE);
const v1Block = v1Lines.map((l) => l.replace(/^ {4}/, '')).join('\n');
const v2Css = readFileSync(V2_CSS_PATH, 'utf8');

if (!v2Css.includes(v1Block)) {
  console.error(
    `check-v1-css-subset: FAIL — v1's <style> block (${V1_PATH}:L${V1_START_LINE}-L${V1_END_LINE}, dedented) is NOT contained verbatim in ${V2_CSS_PATH}.`,
  );
  console.error('');
  console.error('Expected v1 block (after 4-space dedent):');
  console.error('---8<---');
  console.error(v1Block);
  console.error('---8<---');
  console.error('');
  console.error(`First 40 lines of ${V2_CSS_PATH}:`);
  console.error(v2Css.split('\n').slice(0, 40).join('\n'));
  process.exit(1);
}

const ruleCount = (v1Block.match(/^[^\s].*\{/gm) || []).length;
console.log(
  `check-v1-css-subset: OK — pin verified (${actualPin.slice(0, 12)}…) ` +
    `and ${V2_CSS_PATH} contains v1's <style> block ` +
    `(${V1_PATH}:L${V1_START_LINE}-L${V1_END_LINE}, ${ruleCount} top-level rules) verbatim.`,
);
