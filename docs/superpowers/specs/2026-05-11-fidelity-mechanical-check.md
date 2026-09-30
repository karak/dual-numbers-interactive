# v1 ⇄ v2 Fidelity Mechanical Check

**Status:** Required tooling for the v2.0.x fidelity-fix sprint.
**Why:** Hand-written DoD docs (see `2026-05-10-content-fidelity-dod.md`)
proved unreliable as a ground truth — transcription bugs in the DoD
allowed v2 to silently drift from v1 while existing tests still passed.

The fix is mechanical: derive the ground truth directly from
`docs/legacy/index.html`, then assert v2 matches it.

## Pipeline

```
docs/legacy/index.html
        │
        ▼
scripts/extract-v1-content.mjs   ← single source of truth extractor
        │
        ▼
tests/fixtures/v1-content.json   ← machine-generated, do NOT hand-edit
        │
        ▼
tests/e2e/v1-fidelity-strict.spec.ts (content)
tests/e2e/v1-style-audit.spec.ts    (computed CSS)
```

Run all of it with:

```
npm run check-v1-fidelity
```

## What IS mechanically checked

Per `tests/e2e/v1-fidelity-strict.spec.ts`:

- **Sidebar**
  - `aria-label` matches v1 (`例題メニュー`).
  - Link labels match v1 in DOM order, verbatim.
- **Header**
  - `<header>` text contains the v1 title (`Dual Numbers — Interactive`).
- **Per route (intro/poly/trig/chain/newton/grad-descent)**
  - h2 headings exposed with exact name match (`getByRole('heading', {level:2, exact:true})`).
  - h3 headings exposed with exact name match.
  - Descriptive paragraph prose chunks (between `$…$` math islands and dropped non-string siblings) appear in the rendered DOM.
  - Button labels exposed with exact name match.
  - `<select>` options present with exact text.
  - Code blocks contain the first non-empty source line verbatim.

Per `tests/e2e/v1-style-audit.spec.ts`:

- v1's `<main h2>` resolves to a *serif* font; v2 must do the same.
- v1's `<main p>` has non-zero `margin-top + margin-bottom`; v2 must too.
- v1 declares 13 design-token custom properties at `:root`; v2 must expose them by the same names (`--bg`, `--surface`, `--ink`, …, `--font-body`, `--font-ui`, `--font-mono`).
- v1 body resolves to *serif*; v2 too.
- v1 `<header>` is sans-serif, weight ≥ 600; v2 too.

## What is NOT mechanically checked (release-blocker manual checklist)

Add to per-release sign-off after `check-v1-fidelity` is green:

- [ ] Launch v2 dev server, open all 6 routes, and **side-by-side compare with `docs/legacy/index.html`** in a second window.
- [ ] Visual rhythm of headings vs. body — does v2 look like v1?
- [ ] Paragraph spacing — paragraphs are visually separated, not jammed.
- [ ] Sidebar active-item highlight (`bg-[var(--color-accent-soft)] text-[var(--color-accent)]`) renders on the current route.
- [ ] Sidebar link order matches v1 (intro → poly → trig → chain → newton → grad-descent).
- [ ] `<canvas>` plot colours (curve / tangent / axes / point) match v1.
- [ ] Tangent lines on `/poly`, `/chain`, `/newton` use dashed stroke `[6, 4]`.
- [ ] `/poly` step-row LaTeX expansion line uses the v1 ghost colour `#b8b3a8`.
- [ ] LaTeX rendered (no raw `$…$` visible anywhere in main).
- [ ] Keyboard focus indicator (2px outline, accent colour) visible on tab.
- [ ] Slider drag updates step-row LaTeX live, with no flicker.
- [ ] `/newton`, `/grad-descent` warnings appear/disappear at the expected thresholds.

## Operating rules

1. **Do NOT hand-edit `tests/fixtures/v1-content.json`.**  Regenerate via `npm run extract:v1` (or implicitly via `npm run check-v1-fidelity`).  If a v1 paragraph changes, change `docs/legacy/index.html` first and re-extract.
2. **Do NOT weaken assertions to make them pass.**  If a test fails, fix v2.  Exceptions: (a) the extractor produced something obviously wrong (a literal sentinel U+2063 in a button label, etc.), (b) the assertion measures something v1 itself didn't do.
3. **Each fidelity bug fix should keep the test failing until the fix lands.**  If a test starts passing while v2 still looks broken, the test is too lenient and must be tightened first.

## Tracked baseline drift (as of 2026-05-11)

These are the failures observed on `main` at the time this document was written.  They are the work backlog for the fidelity-fix phase.

### Content (`v1-fidelity-strict`)

| Category | v1 | v2 (current) | Test location |
|---|---|---|---|
| Sidebar label `#/intro` | `導入` | `はじめに` | `src/lib/constants.ts:2` |
| Sidebar label `#/trig` | `三角関数` | `三角関数 / Taylor` | `src/lib/constants.ts:4` |

### Style (`v1-style-audit`)

| Property | v1 | v2 (current) | Likely cause |
|---|---|---|---|
| `main p { margin }` | non-zero (browser default ~16px) | `0px 0px` | Tailwind `preflight` resets `<p>` margin, and `prose` is referenced but `@tailwindcss/typography` is not installed. |
| `:root` design tokens | 13 tokens (`--bg`, `--surface`, …, `--font-ui`, `--font-mono`) | only `--color-*` and `--font-body`/`--font-ui`/`--font-mono` (color-bg lives under `--color-bg`, not `--bg`) | Tailwind v4 `@theme` renamed tokens to `--color-*` namespace; v1 component CSS refers to `--bg`, `--ink`, `--accent`, etc., directly. |
| `<header> font-family` | sans-serif (`var(--font-ui)`) | serif (inherits body) | `font-[var(--font-ui)]` is compiled as `font-weight: var(--font-ui)`, not `font-family`. The arbitrary-value class needs to be `font-family-[var(--font-ui)]` or replaced with a proper `font-ui` utility. |

### Style: known incidental finding (not currently asserted)

- v2 `<main h2>` happens to resolve to a serif font (matches v1) — but only by accident, because the same `font-[var(--font-ui)]` class is broken and so h2 inherits body's serif.  Fixing the header above will probably regress this; add an h2-specific assertion at that time.
