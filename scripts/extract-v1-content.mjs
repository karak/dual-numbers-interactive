#!/usr/bin/env node
// v1 -> v2 fidelity baseline extractor.
//
// Reads docs/legacy/index.html (the immutable v1 reference implementation)
// and emits a structured JSON snapshot to tests/fixtures/v1-content.json.
// The JSON is the ground truth that Playwright fidelity tests assert against.
//
// We use regex over the v1 single-file HTML rather than a real HTML/JS parser:
// v1's structure (one inline script, hand-written `h('tag', {}, '...')` calls)
// is regular enough that regex is reliable, and pulling in jsdom would add a
// dep solely for the baseline-generator while obscuring the line-to-fixture
// mapping.
//
// Run:  node scripts/extract-v1-content.mjs
// Out:  tests/fixtures/v1-content.json

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..');
const SRC = resolve(ROOT, 'docs/legacy/index.html');
const OUT = resolve(ROOT, 'tests/fixtures/v1-content.json');

const html = readFileSync(SRC, 'utf8');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Decode a JS single-quoted string literal (the form used in docs/legacy).
// Walk left-to-right so escapes do not get reinterpreted (e.g. `\\n` must
// become a literal backslash-n, not a newline).
function decodeStringLiteral(src) {
  let out = '';
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== '\\') {
      out += src[i];
      continue;
    }
    const next = src[i + 1];
    i++;
    switch (next) {
      case 'n': out += '\n'; break;
      case 't': out += '\t'; break;
      case 'r': out += '\r'; break;
      case '0': out += '\0'; break;
      case "'": out += "'"; break;
      case '"': out += '"'; break;
      case '`': out += '`'; break;
      case '\\': out += '\\'; break;
      case undefined: out += '\\'; break; // trailing backslash
      default:
        // Unrecognised escape: preserve both chars verbatim (covers `\v`,
        // `\u...`, latex backslashes like `\varepsilon` which are NOT JS
        // escape sequences in the source — they're meant to reach the
        // browser as `\varepsilon`).
        out += '\\' + next;
    }
  }
  return out;
}

// Slice an object literal `{ ... }` starting from `startIdx`, balancing braces
// while ignoring braces inside string/template literals.
function sliceObjectLiteral(source, startIdx) {
  let i = startIdx;
  while (i < source.length && source[i] !== '{') i++;
  if (i >= source.length) return null;
  const open = i;
  let depth = 0;
  let inStr = null;
  let prev = '';
  for (; i < source.length; i++) {
    const c = source[i];
    if (inStr) {
      if (c === inStr && prev !== '\\') inStr = null;
    } else if (c === "'" || c === '"' || c === '`') {
      inStr = c;
    } else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return source.slice(open, i + 1);
    }
    prev = c;
  }
  return null;
}

// Pull every `h('TAG', ...)` call (top-level depth) from a snippet. Returns
// the full call source including outer parens.
function collectHCalls(snippet, tag) {
  const out = [];
  const startRe = new RegExp(`h\\(\\s*'${tag}'\\s*,`, 'g');
  let m;
  while ((m = startRe.exec(snippet)) !== null) {
    let i = m.index;
    while (i < snippet.length && snippet[i] !== '(') i++;
    const start = i;
    let depth = 0;
    let end = -1;
    let inStr = null;
    let prev = '';
    for (let j = i; j < snippet.length; j++) {
      const c = snippet[j];
      if (inStr) {
        if (c === inStr && prev !== '\\') inStr = null;
      } else if (c === "'" || c === '"' || c === '`') {
        inStr = c;
      } else if (c === '(') depth++;
      else if (c === ')') {
        depth--;
        if (depth === 0) {
          end = j;
          break;
        }
      }
      prev = c;
    }
    if (end > start) out.push(snippet.slice(start, end + 1));
  }
  return out;
}

// Split an `h(...)` call (including the outer parens) into top-level args.
function splitArgs(callSrc) {
  const inner = callSrc.slice(1, -1);
  const args = [];
  let depth = 0;
  let inStr = null;
  let buf = '';
  let prev = '';
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    if (inStr) {
      buf += c;
      if (c === inStr && prev !== '\\') inStr = null;
    } else if (c === "'" || c === '"' || c === '`') {
      inStr = c;
      buf += c;
    } else if (c === '(' || c === '{' || c === '[') {
      depth++;
      buf += c;
    } else if (c === ')' || c === '}' || c === ']') {
      depth--;
      buf += c;
    } else if (c === ',' && depth === 0) {
      args.push(buf.trim());
      buf = '';
    } else {
      buf += c;
    }
    prev = c;
  }
  if (buf.trim().length) args.push(buf.trim());
  return args;
}

// If an arg is a chain of single-quoted literals joined by `+` (e.g. the
// intro <pre> code block uses `'a\n' + 'b\n' + 'c'`), decode each piece and
// join them.  Returns null if any piece is not a single-quoted literal.
function decodeConcatChain(arg) {
  // Split on `+` at depth 0 (already inside an arg, so we don't care about
  // outer parens; just track string state).
  const parts = [];
  let buf = '';
  let inStr = null;
  let prev = '';
  for (let i = 0; i < arg.length; i++) {
    const c = arg[i];
    if (inStr) {
      buf += c;
      if (c === inStr && prev !== '\\') inStr = null;
    } else if (c === "'" || c === '"' || c === '`') {
      inStr = c;
      buf += c;
    } else if (c === '+') {
      parts.push(buf.trim());
      buf = '';
    } else {
      buf += c;
    }
    prev = c;
  }
  if (buf.trim().length) parts.push(buf.trim());
  const decoded = [];
  for (const p of parts) {
    const m = p.match(/^'((?:\\.|[^'\\])*)'$/);
    if (!m) return null;
    decoded.push(decodeStringLiteral(m[1]));
  }
  return decoded.join('');
}

// Sentinel inserted in place of a dropped non-string child (e.g. a nested
// h('strong', ...) call).  The Playwright probe splits paragraphs on this
// marker so each surviving prose chunk can be asserted independently. The
// chosen value is the Unicode "invisible separator" (U+2063): zero-width,
// won't appear in the v1 source, and not consumed by JSON / regex.
const DROPPED_CHILD_MARKER = '⁣';

// Keep only string-literal args (decoded), DROPPING the first arg (the tag
// name) and the second arg (the attrs object). Skips nested h() calls,
// identifiers, and template literals. Also supports `'a' + 'b'` chains.
// Non-string children are replaced with a sentinel so downstream code can
// distinguish "two prose siblings" from "one prose blob".
function literalArgs(callSrc) {
  const all = splitArgs(callSrc);
  // First arg is the tag literal ('h2', 'p', ...). Second is attrs ({} |
  // {class: ...} | null). Real children start at index 2.
  const children = all.slice(2);
  const out = [];
  for (const a of children) {
    const single = a.match(/^'((?:\\.|[^'\\])*)'$/);
    if (single) {
      out.push(decodeStringLiteral(single[1]));
      continue;
    }
    const concat = decodeConcatChain(a);
    if (concat !== null) {
      out.push(concat);
      continue;
    }
    // dropped (nested h() call, identifier, etc.) — emit a sentinel so
    // adjacent prose chunks don't get glued together at assertion time.
    out.push(DROPPED_CHILD_MARKER);
  }
  return out;
}

// ---------------------------------------------------------------------------
// 1. Header title
// ---------------------------------------------------------------------------
const headerTitleMatch = html.match(/<header class="app-header">([^<]+)<\/header>/);
const headerTitle = headerTitleMatch ? headerTitleMatch[1].trim() : '';

// ---------------------------------------------------------------------------
// 2. Sidebar aria-label
// ---------------------------------------------------------------------------
const ariaMatch = html.match(/<aside[^>]*aria-label="([^"]+)"/);
const sidebarAriaLabel = ariaMatch ? ariaMatch[1] : '';

// ---------------------------------------------------------------------------
// 3. Routes
// ---------------------------------------------------------------------------
const routes = [];
const routeRe = /\{\s*hash:\s*'([^']+)',\s*label:\s*'([^']+)'/g;
let rm;
while ((rm = routeRe.exec(html)) !== null) {
  if (rm[1].startsWith('#/')) routes.push({ hash: rm[1], label: rm[2] });
}

// ---------------------------------------------------------------------------
// 4. Per-example content
// ---------------------------------------------------------------------------
const exampleNames = ['intro', 'poly', 'trig', 'chain', 'newton', 'gradDescent'];
const examples = {};

for (const name of exampleNames) {
  const headerRe = new RegExp(`examples\\.${name}\\s*=\\s*`);
  const headerMatch = headerRe.exec(html);
  if (!headerMatch) {
    examples[name] = { error: `block not found: examples.${name}` };
    continue;
  }
  const body = sliceObjectLiteral(html, headerMatch.index + headerMatch[0].length);
  if (!body) {
    examples[name] = { error: `unbalanced braces for examples.${name}` };
    continue;
  }

  const titleMatch = body.match(/title:\s*'([^']+)'/);
  const title = titleMatch ? titleMatch[1] : '';
  const hashMatch = body.match(/hash:\s*'([^']+)'/);
  const hash = hashMatch ? hashMatch[1] : '';

  // Treat a join that is only sentinels/whitespace as "no literal text".
  const isMeaningful = (s) => s.replace(/[⁣\s]+/g, '').length > 0;

  const h2 = [];
  for (const call of collectHCalls(body, 'h2')) {
    const lits = literalArgs(call);
    if (lits.length && isMeaningful(lits.join(''))) h2.push(lits.join(''));
  }
  // Poly/Trig/Chain/Newton/Grad render the h2 via `examples.<name>.title`
  // (identifier, not literal), so collectHCalls finds no literal arg. Fall
  // back to the captured `title:` value so the fixture is non-empty.
  if (h2.length === 0 && title) h2.push(title);

  const h3 = [];
  for (const call of collectHCalls(body, 'h3')) {
    const lits = literalArgs(call);
    const joined = lits.join('');
    if (isMeaningful(joined)) h3.push(joined);
  }

  const paragraphs = [];
  for (const call of collectHCalls(body, 'p')) {
    const lits = literalArgs(call);
    const joined = lits.join('');
    if (isMeaningful(joined)) paragraphs.push(joined);
  }

  const buttons = [];
  for (const call of collectHCalls(body, 'button')) {
    const lits = literalArgs(call);
    const joined = lits.join('');
    if (isMeaningful(joined)) buttons.push(joined);
  }

  const code = [];
  for (const call of collectHCalls(body, 'pre')) {
    const lits = literalArgs(call);
    const joined = lits.join('');
    if (isMeaningful(joined)) code.push(joined);
  }

  const selectOptions = [];
  for (const call of collectHCalls(body, 'option')) {
    const lits = literalArgs(call);
    const joined = lits.join('');
    if (isMeaningful(joined)) selectOptions.push(joined);
  }

  // makeSlider({ ..., label: '...' }) — decode the literal so backslash-only
  // escapes (LaTeX `\eta` written as `\\eta` in JS source) come out as the
  // run-time string the user sees.
  const sliderLabels = [];
  const sliderRe = /makeSlider\(\{[^}]*label:\s*'((?:\\.|[^'\\])*)'/g;
  let s;
  while ((s = sliderRe.exec(body)) !== null) sliderLabels.push(decodeStringLiteral(s[1]));

  examples[name] = {
    hash,
    title,
    rendered: { h2, h3, paragraphs, buttons, code, sliderLabels, selectOptions },
  };
}

// ---------------------------------------------------------------------------
// 5. CSS tokens + body font + header style
// ---------------------------------------------------------------------------
function pickRootBlock(src) {
  const m = src.match(/:root\s*\{([\s\S]*?)\}/);
  return m ? m[1] : '';
}
const rootBlock = pickRootBlock(html);
const tokens = {};
for (const line of rootBlock.split(/;\s*/)) {
  const m = line.match(/^\s*(--[a-z0-9-]+)\s*:\s*(.*?)\s*$/i);
  if (m) tokens[m[1]] = m[2];
}

const bodyMatch = html.match(
  /body\s*\{[^}]*font-family:\s*([^;]+);[^}]*line-height:\s*([^;]+);/,
);
const bodyFont = bodyMatch ? bodyMatch[1].trim() : '';
const lineHeight = bodyMatch ? bodyMatch[2].trim() : '';

const headerCss = html.match(/header\.app-header\s*\{([^}]+)\}/);
const headerStyle = {};
if (headerCss) {
  for (const decl of headerCss[1].split(';')) {
    const idx = decl.indexOf(':');
    if (idx < 0) continue;
    const key = decl.slice(0, idx).trim();
    const val = decl.slice(idx + 1).trim();
    if (key) headerStyle[key] = val;
  }
}

// ---------------------------------------------------------------------------
// 6. Assemble + write
// ---------------------------------------------------------------------------
const out = {
  $note:
    'Auto-generated by scripts/extract-v1-content.mjs from docs/legacy/index.html. Do not hand-edit.',
  header: { title: headerTitle },
  sidebar: { ariaLabel: sidebarAriaLabel, routes },
  examples,
  css: {
    tokens,
    bodyFont,
    uiFont: tokens['--font-ui'] ?? '',
    monoFont: tokens['--font-mono'] ?? '',
    lineHeight,
    headerStyle,
  },
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8');

const exampleSummary = Object.entries(examples)
  .map(
    ([k, v]) =>
      `  ${k.padEnd(11)} h2=${v.rendered?.h2.length ?? 0} ` +
      `h3=${v.rendered?.h3.length ?? 0} p=${v.rendered?.paragraphs.length ?? 0} ` +
      `btn=${v.rendered?.buttons.length ?? 0} opt=${v.rendered?.selectOptions.length ?? 0}`,
  )
  .join('\n');

console.log(`[extract-v1] wrote ${OUT}`);
console.log(`[extract-v1] header.title      = "${headerTitle}"`);
console.log(`[extract-v1] sidebar.ariaLabel = "${sidebarAriaLabel}"`);
console.log(`[extract-v1] sidebar.routes    = ${routes.length}`);
for (const r of routes) console.log(`    ${r.hash.padEnd(18)} ${r.label}`);
console.log(`[extract-v1] examples:\n${exampleSummary}`);
console.log(`[extract-v1] css.tokens        = ${Object.keys(tokens).length} entries`);
