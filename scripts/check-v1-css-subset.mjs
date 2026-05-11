#!/usr/bin/env node
/*
 * Step 4 guard #2 (.claude/plans/rustling-swinging-crescent.md).
 *
 * Verifies that the <style> block at docs/legacy/index.html:L15-49
 * appears verbatim inside src/index.css after stripping the four-space
 * HTML indent that v1's <style> content carries (it sits inside <head>).
 * No CSS parser is needed — the verbatim-port rule is a literal substring
 * check, which is the strictest form of "v1 rules are present unchanged".
 *
 * Reading v1 at test time (not from a baked fixture) ensures we never
 * verify against a stale snapshot — if docs/legacy/index.html changes the
 * check will refresh automatically.
 *
 * Failure mode: prints the expected v1 block and a head/tail of src/index.css
 * for diagnosis, then exits 1.
 */
import { readFileSync } from 'node:fs';

const V1_PATH = 'docs/legacy/index.html';
const V2_PATH = 'src/index.css';

// L15-49 inclusive (1-indexed) of v1; lines slice() uses 0-indexed [start, end).
const V1_START_LINE = 15;
const V1_END_LINE = 49;

const v1Html = readFileSync(V1_PATH, 'utf8');
const v1Lines = v1Html.split('\n').slice(V1_START_LINE - 1, V1_END_LINE);
// v1 is embedded in <style> 4-space-indented inside <head>; strip that.
const v1Block = v1Lines.map((l) => l.replace(/^ {4}/, '')).join('\n');

const v2Css = readFileSync(V2_PATH, 'utf8');

if (!v2Css.includes(v1Block)) {
  console.error(
    `check-v1-css-subset: FAIL — v1's <style> block (${V1_PATH}:L${V1_START_LINE}-L${V1_END_LINE}, dedented) is NOT contained verbatim in ${V2_PATH}.`,
  );
  console.error('');
  console.error('Expected v1 block (after 4-space dedent):');
  console.error('---8<---');
  console.error(v1Block);
  console.error('---8<---');
  console.error('');
  console.error(`First 40 lines of ${V2_PATH}:`);
  console.error(v2Css.split('\n').slice(0, 40).join('\n'));
  process.exit(1);
}

const ruleCount = (v1Block.match(/^[^\s].*\{/gm) || []).length;
console.log(
  `check-v1-css-subset: OK — ${V2_PATH} contains v1's <style> block ` +
    `(${V1_PATH}:L${V1_START_LINE}-L${V1_END_LINE}, ${ruleCount} top-level rules) verbatim.`,
);
