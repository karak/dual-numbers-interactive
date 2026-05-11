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
 * Failure mode: prints offending file:line and exits 1.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) yield* walk(p);
    else yield p;
  }
}

const FILES = Array.from(walk('src')).filter((f) =>
  /\.(?:tsx?|css)$/.test(f),
);

// 1) Any mention of 'tailwind' (substring — catches tailwindcss, @tailwind,
//    tailwind-merge, etc.) or '@apply' directive.
const META = /tailwind|@apply\b/i;

// 2) Common Tailwind utility class shapes inside className="..." or
//    className={`...`}. Whitelist of class prefixes that have produced
//    drift in this repo; broaden as needed when new offenders appear.
const UTIL = /\b(?:flex|grid-cols-|grid-rows-|mt-\d|mb-\d|ml-\d|mr-\d|mx-\d|my-\d|m-\d|pt-\d|pb-\d|pl-\d|pr-\d|px-\d|py-\d|p-\d|space-y-|space-x-|gap-\d|text-sm|text-base|text-lg|text-xl|text-\[|bg-\[|border-\[|rounded(?:-|\b)|w-full|max-w-\[|min-h-\[|font-\[|leading-\[)/;
const CLASSNAME_RE = /className\s*=\s*(?:"([^"]*)"|\{`([^`]*)`\}|\{\s*\(\s*\{\s*isActive\s*\}\s*\)\s*=>\s*\(?\s*isActive\s*\?\s*['"]([^'"]*)['"]\s*:\s*['"]([^'"]*)['"]\s*\)?\s*\})/g;

const offenders = [];

for (const file of FILES) {
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');

  // (1) global token check
  for (let i = 0; i < lines.length; i++) {
    if (META.test(lines[i])) {
      offenders.push({ file, line: i + 1, kind: 'meta', text: lines[i].trim() });
    }
  }

  // (2) utility-class check inside className= contexts
  let m;
  CLASSNAME_RE.lastIndex = 0;
  while ((m = CLASSNAME_RE.exec(text)) !== null) {
    const value = m[1] ?? m[2] ?? `${m[3] ?? ''} ${m[4] ?? ''}`;
    if (UTIL.test(value)) {
      const upTo = text.slice(0, m.index);
      const line = upTo.split('\n').length;
      offenders.push({ file, line, kind: 'utility', text: m[0] });
    }
  }
}

if (offenders.length > 0) {
  console.error(`check-no-tailwind: ${offenders.length} offender(s) found`);
  for (const o of offenders) {
    console.error(`  ${o.file}:${o.line}  [${o.kind}]  ${o.text.slice(0, 120)}`);
  }
  process.exit(1);
}
console.log(`check-no-tailwind: OK (${FILES.length} src files scanned, 0 offenders)`);
