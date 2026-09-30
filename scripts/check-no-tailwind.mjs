#!/usr/bin/env node
/*
 * Step 4 guard #1 (.claude/plans/rustling-swinging-crescent.md).
 *
 * v1 (docs/legacy/index.html) has zero Tailwind. v2's previous 11-round
 * drift loop was caused by adopting Tailwind preflight, which introduced
 * UA-default resets v1 doesn't have, then patching each surfaced regression.
 * This check forbids any Tailwind dependency or utility class reappearing
 * in src/ so future contributors can't accidentally re-create the drift.
 *
 * Two detection paths:
 *   (1) META: substring 'tailwind' / '@apply' anywhere in source.
 *   (2) UTIL: Tailwind-shape utility-class tokens anywhere in non-comment
 *       source text — covers className="...", className={`...`}, variable
 *       indirection (`const cls = 'flex gap-4'; <div className={cls}/>`),
 *       helper assembly (`['flex', 'gap-N'].join(' ')`), and clsx-style libs.
 *       Comments (//... and /\* ... *\/) are stripped before scanning so
 *       documentation referencing utility names is allowed.
 *
 * Scan dir defaults to 'src'; override with SCAN_DIR=... for tests.
 *
 * Failure mode: prints offending file:line and exits 1.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SCAN_DIR = process.env.SCAN_DIR ?? 'src';

function* walk(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

const FILES = Array.from(walk(SCAN_DIR)).filter((f) =>
  /\.(?:tsx?|css)$/.test(f),
);

// (1) Any mention of 'tailwind' (substring — catches tailwindcss, @tailwind,
//     tailwind-merge, etc.) or '@apply' directive.
const META = /tailwind|@apply\b/i;

// (2) Tailwind-shape utility-class tokens. Word boundary on the left + a
//     suffix that's a Tailwind-specific shape (digit, hyphen, '[' for
//     arbitrary value, or end-of-token). Whitelist of prefixes that
//     produced drift in this repo; extend as new offenders appear.
const UTIL =
  /\b(?:flex|grid-cols-|grid-rows-|mt-\d|mb-\d|ml-\d|mr-\d|mx-\d|my-\d|m-\d|pt-\d|pb-\d|pl-\d|pr-\d|px-\d|py-\d|p-\d|space-y-|space-x-|gap-\d|text-sm|text-base|text-lg|text-xl|text-\[|bg-\[|border-\[|rounded(?:-|\b)|w-full|max-w-\[|min-h-\[|font-\[|leading-\[)/;

// Strip /* … */ block comments and // … line comments. Naïve but enough:
// we only want to suppress false positives from prose. URLs containing //
// (https://) survive because the strip is greedy-anchored on a line-comment
// // that's NOT inside a string — which we don't try to parse; instead, the
// META/UTIL regexes look for specific shapes that don't include `://`.
function stripComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

const offenders = [];

for (const file of FILES) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');

  // META: scan original text (catches '@import "tailwindcss"' which doesn't
  // depend on comment context).
  for (let i = 0; i < lines.length; i++) {
    if (META.test(lines[i])) {
      offenders.push({ file, line: i + 1, kind: 'meta', text: lines[i].trim() });
    }
  }

  // UTIL: scan code (comments stripped) line by line so we can report the
  // correct line number.
  const stripped = stripComments(text).split('\n');
  for (let i = 0; i < stripped.length; i++) {
    const m = stripped[i].match(UTIL);
    if (m) {
      offenders.push({ file, line: i + 1, kind: 'utility', text: lines[i].trim() });
    }
  }
}

if (offenders.length > 0) {
  console.error(`check-no-tailwind: ${offenders.length} offender(s) found in ${SCAN_DIR}`);
  for (const o of offenders) {
    console.error(`  ${o.file}:${o.line}  [${o.kind}]  ${o.text.slice(0, 120)}`);
  }
  process.exit(1);
}
console.log(`check-no-tailwind: OK (${FILES.length} files scanned under ${SCAN_DIR}, 0 offenders)`);
