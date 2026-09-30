# Vite + React + TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faithfully port the single-file vanilla HTML SPA (`index.html`, v1.0.0) to a Vite + React + TypeScript + Tailwind v4 application with Vitest/RTL/Playwright three-layer testing, preserving all 6 routes and existing behavior.

**Architecture:** New Vite root replaces `index.html`. React functional components organize per-route logic. `Dual` class and pure utilities live in `src/lib/`. MathJax integrated via `better-react-mathjax`. Canvas wrapped in `useCanvas` hook with DPR + ResizeObserver. v1 preserved as `docs/legacy/index.html` and git tag `v1.0.0`.

**Tech Stack:** Vite 6 / React 18 / TypeScript 5.6 / Tailwind v4 / better-react-mathjax 2 / react-router-dom v6 (HashRouter) / Vitest 2 / @testing-library/react 16 / @playwright/test 1 / Node 22

**Spec:** `docs/superpowers/specs/2026-05-10-vite-react-migration-design.md`

---

## Working branch

All tasks run on a `feat/v2` branch. Final task merges back to main.

---

## Task 1: Safety net (tag v1, backup, branch)

**Files:**
- Create: `docs/legacy/index.html` (copy of current `index.html`)
- Create: `CHANGELOG.md`
- Modify: none

**Pre-conditions:** working tree clean, on `main`.

- [ ] **Step 1: Verify clean tree and current branch**

Run: `git status && git rev-parse --abbrev-ref HEAD`
Expected: `nothing to commit, working tree clean` and `main`.

- [ ] **Step 2: Tag v1.0.0**

Run: `git tag -a v1.0.0 -m "v1.0.0: vanilla HTML/JS SPA, complete dual-numbers demo"`
Then: `git push origin v1.0.0`

- [ ] **Step 3: Copy v1 source to legacy folder**

Run: `mkdir -p docs/legacy && cp index.html docs/legacy/index.html`

- [ ] **Step 4: Create CHANGELOG.md**

Write `CHANGELOG.md`:
```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- Migrating to Vite + React + TypeScript + Tailwind v4 stack (in progress on `feat/v2`)

## [1.0.0] - 2026-05-10

Initial release: single-file vanilla HTML/JS SPA with 6 interactive examples
of forward-mode automatic differentiation using dual numbers (`Dual` class).
Lighthouse Accessibility 100. 27 in-page unit tests + Playwright smoke suite.

Source preserved at `docs/legacy/index.html` and git tag `v1.0.0`.
```

- [ ] **Step 5: Commit and create working branch**

```bash
git add docs/legacy/index.html CHANGELOG.md
git commit -m "chore: snapshot v1.0.0 to docs/legacy and add CHANGELOG"
git checkout -b feat/v2
git push -u origin feat/v2
```

---

## Task 2: Vite scaffold + base dependencies

**Files:**
- Create/overwrite: `package.json`, `index.html`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `.eslintrc.cjs` (or `eslint.config.js`)
- Modify: `.gitignore`

**Note:** Vite scaffolder writes `index.html` at repo root. v1 source is already preserved in `docs/legacy/index.html`.

- [ ] **Step 1: Remove the v1 root index.html (its content lives in docs/legacy)**

Run: `rm index.html`
Verify: `ls docs/legacy/index.html` (file exists)

- [ ] **Step 2: Initialize package.json**

Write `package.json`:
```json
{
  "name": "dual-numbers-interactive",
  "private": true,
  "version": "2.0.0-dev",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc -b --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Install runtime dependencies**

Run: `npm i react@^18 react-dom@^18 react-router-dom@^6 better-react-mathjax@^2`

- [ ] **Step 4: Install dev dependencies**

Run: `npm i -D vite@^6 @vitejs/plugin-react@^4 typescript@^5.6 @types/react@^18 @types/react-dom@^18 eslint@^9 @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh`

- [ ] **Step 5: Create tsconfig.json**

Write `tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

Write `tsconfig.app.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": false,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

Write `tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 6: Create vite.config.ts**

Write `vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', sourcemap: true },
});
```

- [ ] **Step 7: Create new root index.html**

Write `index.html`:
```html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dual Numbers — Interactive</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create src/main.tsx**

Write `src/main.tsx`:
```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

- [ ] **Step 9: Create stub src/App.tsx**

Write `src/App.tsx` (stub — full shell comes in Task 15):
```tsx
export default function App() {
  return <div>Dual Numbers — v2 boot</div>;
}
```

- [ ] **Step 10: Create stub src/index.css**

Write `src/index.css`:
```css
/* Tailwind v4 + tokens come in Task 3 */
body { font-family: system-ui, sans-serif; margin: 0; }
```

- [ ] **Step 11: Append node-related ignores to .gitignore**

Run: read current `.gitignore`. It already covers `node_modules/`, `dist/`, etc. Verify by:
```bash
grep -E "^(node_modules|dist|coverage|playwright-report)/" .gitignore
```
Expected: all four match.
If anything is missing, append it.

- [ ] **Step 12: Run dev server smoke test**

Run: `npm run dev` (in background) then `curl -s http://localhost:5173/ | head -5`
Expected output contains `<div id="root">`.
Stop the dev server.

- [ ] **Step 13: Run typecheck and build**

Run: `npm run typecheck && npm run build`
Expected: both succeed, `dist/index.html` and `dist/assets/*.js` exist.

- [ ] **Step 14: Commit**

```bash
git add package.json package-lock.json tsconfig*.json vite.config.ts index.html src .gitignore
git commit -m "feat(v2): scaffold Vite + React + TypeScript project"
```

---

## Task 3: Tailwind v4 + design tokens

**Files:**
- Modify: `package.json`, `vite.config.ts`, `src/index.css`

- [ ] **Step 1: Install Tailwind v4**

Run: `npm i -D tailwindcss@^4 @tailwindcss/vite@^4`

- [ ] **Step 2: Add Tailwind plugin to vite.config.ts**

Modify `vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  build: { outDir: 'dist', sourcemap: true },
});
```

- [ ] **Step 3: Replace src/index.css with Tailwind + tokens**

Overwrite `src/index.css`:
```css
@import "tailwindcss";

@theme {
  --color-bg: #fafaf7;
  --color-surface: #ffffff;
  --color-ink: #1a1a1a;
  --color-ink-soft: #4a4a4a;
  --color-border: #e8e6e0;
  --color-accent: #5538e8;
  --color-accent-soft: #ede9ff;
  --color-curve: #1a1a1a;
  --color-tangent: #6b4eff;
  --color-ghost: #b8b3a8;
  --color-warn: #b00020;
  --radius: 4px;
  --font-body: 'Noto Serif JP', 'Source Serif Pro', Georgia, serif;
  --font-ui: -apple-system, BlinkMacSystemFont, 'Hiragino Sans', sans-serif;
  --font-mono: 'JetBrains Mono', Menlo, monospace;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-body);
  line-height: 1.6;
}

button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

canvas {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
```

- [ ] **Step 4: Verify Tailwind utility resolves**

Modify `src/App.tsx` temporarily:
```tsx
export default function App() {
  return <div className="p-4 bg-accent-soft text-accent">tailwind ok</div>;
}
```

Run: `npm run dev` (background), `curl -s http://localhost:5173/ | grep -o 'src=.*\.css' | head -1` should reference a generated css module. Open in browser optionally.

Stop dev server.

- [ ] **Step 5: Restore App.tsx stub**

Modify `src/App.tsx` back to:
```tsx
export default function App() {
  return <div>Dual Numbers — v2 boot</div>;
}
```

- [ ] **Step 6: Build to confirm production bundle**

Run: `npm run build`
Expected: `dist/assets/*.css` contains tailwind utilities (e.g., grep `--color-accent` in `dist/assets/*.css`).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/index.css src/App.tsx
git commit -m "feat(v2): integrate Tailwind v4 with design tokens"
```

---

## Task 4: Vitest + React Testing Library setup

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`, `tests/unit/sanity.test.ts`
- Modify: `package.json` (already has `test` script)

- [ ] **Step 1: Install Vitest + RTL + jsdom**

Run: `npm i -D vitest@^2 @vitest/ui jsdom @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14`

- [ ] **Step 2: Create vitest.config.ts**

Write `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/components/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**'],
  },
});
```

- [ ] **Step 3: Create test setup file**

Write `src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 4: Create sanity test**

Write `tests/unit/sanity.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('vitest sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: `1 passed`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test tests/unit/sanity.test.ts
git commit -m "feat(v2): set up Vitest + React Testing Library"
```

---

## Task 5: Playwright setup

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/sanity.spec.ts`
- Modify: `.gitignore` (if needed)

- [ ] **Step 1: Install Playwright Test**

Run: `npm i -D @playwright/test@^1.48`
Then: `npx playwright install --with-deps chromium`

- [ ] **Step 2: Create playwright.config.ts**

Write `playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  reporter: 'list',
  webServer: {
    command: 'npm run dev -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Step 3: Create sanity e2e test**

Write `tests/e2e/sanity.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('app boots', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root')).not.toBeEmpty();
});
```

- [ ] **Step 4: Run e2e**

Run: `npm run test:e2e`
Expected: `1 passed`.

- [ ] **Step 5: Append playwright artifacts to .gitignore (if missing)**

Verify `.gitignore` already contains `playwright-report/` and `playwright/.cache/`. If `test-results/` is missing, append it.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json playwright.config.ts tests/e2e/sanity.spec.ts .gitignore
git commit -m "feat(v2): set up Playwright e2e harness"
```

---

## Task 6: Constants module

**Files:**
- Create: `src/lib/constants.ts`

- [ ] **Step 1: Write constants.ts**

Write `src/lib/constants.ts`:
```ts
export const ROUTES = [
  { path: 'intro',        label: 'はじめに' },
  { path: 'poly',         label: '多項式' },
  { path: 'trig',         label: '三角関数 / Taylor' },
  { path: 'chain',        label: '連鎖律' },
  { path: 'newton',       label: 'Newton 法' },
  { path: 'grad-descent', label: '勾配降下' },
] as const;

export type RoutePath = (typeof ROUTES)[number]['path'];

export const COLORS = {
  curve:   'var(--color-curve)',
  tangent: 'var(--color-tangent)',
  border:  'var(--color-border)',
  accent:  'var(--color-accent)',
  ghost:   'var(--color-ghost)',
} as const;

export const EPS = 1e-9;
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/lib/constants.ts
git commit -m "feat(v2): add constants module"
```

---

## Task 7: Format utilities (TDD)

**Files:**
- Create: `tests/unit/format.test.ts`, `src/lib/format.ts`

- [ ] **Step 1: Write failing tests**

Write `tests/unit/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { fmt3, signed } from '../../src/lib/format';

describe('fmt3', () => {
  it('formats positive number with 3 decimals', () => {
    expect(fmt3(1.23456)).toBe('1.235');
  });
  it('formats integer', () => {
    expect(fmt3(2)).toBe('2.000');
  });
  it('formats negative', () => {
    expect(fmt3(-0.5)).toBe('-0.500');
  });
});

describe('signed', () => {
  it('prefixes + for positive', () => {
    expect(signed(2)).toBe('+ 2');
  });
  it('prefixes - for negative', () => {
    expect(signed(-3)).toBe('- 3');
  });
  it('handles zero as +', () => {
    expect(signed(0)).toBe('+ 0');
  });
});
```

- [ ] **Step 2: Run tests (expect failure)**

Run: `npm test -- tests/unit/format.test.ts`
Expected: 6 failures (module not found).

- [ ] **Step 3: Implement format.ts**

Write `src/lib/format.ts`:
```ts
export const fmt3 = (n: number): string => n.toFixed(3);

export const signed = (n: number): string =>
  n < 0 ? `- ${Math.abs(n)}` : `+ ${n}`;
```

- [ ] **Step 4: Run tests (expect pass)**

Run: `npm test -- tests/unit/format.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/format.test.ts src/lib/format.ts
git commit -m "feat(v2): add format utilities (TDD)"
```

---

## Task 8: Dual class — arithmetic (TDD)

**Files:**
- Create: `tests/unit/Dual.test.ts`, `src/lib/Dual.ts`

This task ports the arithmetic portion of v1's `Dual` class. Transcendentals come in Task 9.

- [ ] **Step 1: Write failing tests for arithmetic + factory**

Write `tests/unit/Dual.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { Dual } from '../../src/lib/Dual';

const eq = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('Dual factory', () => {
  it('Dual.c is constant (du = 0)', () => {
    const a = Dual.c(5);
    expect(eq(a.re, 5) && eq(a.du, 0)).toBe(true);
  });
  it('Dual.v is variable (du = 1)', () => {
    const a = Dual.v(3);
    expect(eq(a.re, 3) && eq(a.du, 1)).toBe(true);
  });
});

describe('Dual arithmetic', () => {
  it('add: f(x) = x + 2 at x=3 → f=5, df=1', () => {
    const r = Dual.v(3).add(Dual.c(2));
    expect(eq(r.re, 5) && eq(r.du, 1)).toBe(true);
  });
  it('sub: f(x) = x - 4 at x=10 → f=6, df=1', () => {
    const r = Dual.v(10).sub(Dual.c(4));
    expect(eq(r.re, 6) && eq(r.du, 1)).toBe(true);
  });
  it('mul: f(x) = x*x at x=3 → f=9, df=6', () => {
    const x = Dual.v(3);
    const r = x.mul(x);
    expect(eq(r.re, 9) && eq(r.du, 6)).toBe(true);
  });
  it('div: f(x) = x/2 at x=8 → f=4, df=0.5', () => {
    const r = Dual.v(8).div(Dual.c(2));
    expect(eq(r.re, 4) && eq(r.du, 0.5)).toBe(true);
  });
  it('div quotient rule: f(x)=1/x at x=2 → df=-0.25', () => {
    const r = Dual.c(1).div(Dual.v(2));
    expect(eq(r.re, 0.5) && eq(r.du, -0.25)).toBe(true);
  });
  it('neg: f(x) = -x at x=3 → f=-3, df=-1', () => {
    const r = Dual.v(3).neg();
    expect(eq(r.re, -3) && eq(r.du, -1)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests (expect failure)**

Run: `npm test -- tests/unit/Dual.test.ts`
Expected: 8 failures (module not found).

- [ ] **Step 3: Implement Dual.ts (arithmetic only)**

Write `src/lib/Dual.ts`:
```ts
export class Dual {
  readonly re: number;
  readonly du: number;

  constructor(re: number, du = 0) {
    this.re = re;
    this.du = du;
  }

  static c(x: number): Dual {
    return new Dual(x, 0);
  }
  static v(x: number): Dual {
    return new Dual(x, 1);
  }

  add(b: Dual): Dual {
    return new Dual(this.re + b.re, this.du + b.du);
  }
  sub(b: Dual): Dual {
    return new Dual(this.re - b.re, this.du - b.du);
  }
  mul(b: Dual): Dual {
    return new Dual(
      this.re * b.re,
      this.re * b.du + this.du * b.re,
    );
  }
  div(b: Dual): Dual {
    const r = b.re;
    return new Dual(this.re / r, (this.du * r - this.re * b.du) / (r * r));
  }
  neg(): Dual {
    return new Dual(-this.re, -this.du);
  }
}
```

- [ ] **Step 4: Run tests (expect pass)**

Run: `npm test -- tests/unit/Dual.test.ts`
Expected: 8 passed.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/Dual.test.ts src/lib/Dual.ts
git commit -m "feat(v2): port Dual class arithmetic (TDD)"
```

---

## Task 9: Dual class — transcendentals + pow (TDD)

**Files:**
- Modify: `tests/unit/Dual.test.ts`, `src/lib/Dual.ts`

- [ ] **Step 1: Append failing tests for transcendentals**

Append to `tests/unit/Dual.test.ts`:
```ts
describe('Dual transcendentals', () => {
  it('sin: d/dx sin(x) at x=0 is cos(0)=1', () => {
    const r = Dual.v(0).sin();
    expect(eq(r.re, 0) && eq(r.du, 1)).toBe(true);
  });
  it('cos: d/dx cos(x) at x=π/2 is -1', () => {
    const r = Dual.v(Math.PI / 2).cos();
    expect(eq(r.re, 0) && eq(r.du, -1)).toBe(true);
  });
  it('exp: d/dx e^x at x=1 is e', () => {
    const r = Dual.v(1).exp();
    expect(eq(r.re, Math.E) && eq(r.du, Math.E)).toBe(true);
  });
  it('log: d/dx ln(x) at x=2 is 1/2', () => {
    const r = Dual.v(2).log();
    expect(eq(r.re, Math.log(2)) && eq(r.du, 0.5)).toBe(true);
  });
  it('pow: d/dx x^3 at x=2 is 12', () => {
    const r = Dual.v(2).pow(3);
    expect(eq(r.re, 8) && eq(r.du, 12)).toBe(true);
  });
  it('chain via composition: d/dx sin(x^2) at x=2 = 4 cos(4)', () => {
    const r = Dual.v(2).pow(2).sin();
    expect(eq(r.re, Math.sin(4)) && eq(r.du, 4 * Math.cos(4))).toBe(true);
  });
  it('pow guard: pow(0, n<1) returns NaN derivative when du≠0', () => {
    const r = Dual.v(0).pow(0.5);
    expect(r.re).toBe(0);
    expect(Number.isNaN(r.du)).toBe(true);
  });
  it('pow guard: pow(0, n<1) returns 0 derivative when du=0', () => {
    const r = Dual.c(0).pow(0.5);
    expect(r.re).toBe(0);
    expect(r.du).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests (expect failure)**

Run: `npm test -- tests/unit/Dual.test.ts`
Expected: 8 new failures (sin/cos/exp/log/pow not implemented).

- [ ] **Step 3: Append transcendentals to Dual.ts**

Append to `src/lib/Dual.ts` (inside the class, before the closing brace):
```ts
  sin(): Dual {
    return new Dual(Math.sin(this.re), Math.cos(this.re) * this.du);
  }
  cos(): Dual {
    return new Dual(Math.cos(this.re), -Math.sin(this.re) * this.du);
  }
  exp(): Dual {
    const e = Math.exp(this.re);
    return new Dual(e, e * this.du);
  }
  log(): Dual {
    return new Dual(Math.log(this.re), this.du / this.re);
  }
  pow(n: number): Dual {
    const r = Math.pow(this.re, n);
    if (this.re === 0 && n < 1) {
      return new Dual(r, this.du === 0 ? 0 : NaN);
    }
    return new Dual(r, n * Math.pow(this.re, n - 1) * this.du);
  }
```

- [ ] **Step 4: Run tests (expect pass)**

Run: `npm test -- tests/unit/Dual.test.ts`
Expected: 16 passed.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/Dual.test.ts src/lib/Dual.ts
git commit -m "feat(v2): port Dual class transcendentals + pow guard (TDD)"
```

---

## Task 10: Plot utilities (TDD)

**Files:**
- Create: `tests/unit/plot.test.ts`, `src/lib/plot.ts`

- [ ] **Step 1: Write failing tests**

Write `tests/unit/plot.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { makePlotMap } from '../../src/lib/plot';

const eq = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('makePlotMap', () => {
  it('maps domain mid to canvas mid x', () => {
    const m = makePlotMap({ xMin: -1, xMax: 1, yMin: -1, yMax: 1, w: 600, h: 360 });
    expect(eq(m.toX(0), 300)).toBe(true);
    expect(eq(m.toY(0), 180)).toBe(true);
  });
  it('yMax → canvas top', () => {
    const m = makePlotMap({ xMin: 0, xMax: 1, yMin: 0, yMax: 1, w: 100, h: 100 });
    expect(eq(m.toY(1), 0)).toBe(true);
  });
  it('xMax → canvas right edge', () => {
    const m = makePlotMap({ xMin: 0, xMax: 10, yMin: 0, yMax: 1, w: 200, h: 100 });
    expect(eq(m.toX(10), 200)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests (expect failure)**

Run: `npm test -- tests/unit/plot.test.ts`
Expected: 3 failures.

- [ ] **Step 3: Implement plot.ts**

Write `src/lib/plot.ts`:
```ts
export interface PlotBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  w: number;
  h: number;
}

export interface PlotMap extends PlotBounds {
  toX(x: number): number;
  toY(y: number): number;
}

export function makePlotMap(b: PlotBounds): PlotMap {
  return {
    ...b,
    toX: (x) => ((x - b.xMin) / (b.xMax - b.xMin)) * b.w,
    toY: (y) => b.h - ((y - b.yMin) / (b.yMax - b.yMin)) * b.h,
  };
}

export interface CurveOptions {
  color?: string;
  width?: number;
  dash?: number[];
}

export function drawAxes(
  ctx: CanvasRenderingContext2D,
  m: PlotMap,
  borderColor = '#e8e6e0',
): void {
  ctx.save();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1;
  if (m.yMin <= 0 && m.yMax >= 0) {
    ctx.beginPath();
    ctx.moveTo(0, m.toY(0));
    ctx.lineTo(m.w, m.toY(0));
    ctx.stroke();
  }
  if (m.xMin <= 0 && m.xMax >= 0) {
    ctx.beginPath();
    ctx.moveTo(m.toX(0), 0);
    ctx.lineTo(m.toX(0), m.h);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCurve(
  ctx: CanvasRenderingContext2D,
  m: PlotMap,
  fn: (x: number) => number,
  opts: CurveOptions = {},
): void {
  ctx.save();
  ctx.strokeStyle = opts.color ?? '#1a1a1a';
  ctx.lineWidth = opts.width ?? 2;
  if (opts.dash) ctx.setLineDash(opts.dash);
  ctx.beginPath();
  let started = false;
  const N = 600;
  for (let i = 0; i <= N; i++) {
    const x = m.xMin + (m.xMax - m.xMin) * (i / N);
    const y = fn(x);
    if (!Number.isFinite(y)) {
      started = false;
      continue;
    }
    const px = m.toX(x);
    const py = m.toY(y);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
  ctx.restore();
}

export function drawPoint(
  ctx: CanvasRenderingContext2D,
  m: PlotMap,
  x: number,
  y: number,
  color = '#6b4eff',
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(m.toX(x), m.toY(y), 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

export function drawTangent(
  ctx: CanvasRenderingContext2D,
  m: PlotMap,
  x0: number,
  y0: number,
  slope: number,
  color = '#6b4eff',
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(m.toX(m.xMin), m.toY(y0 + slope * (m.xMin - x0)));
  ctx.lineTo(m.toX(m.xMax), m.toY(y0 + slope * (m.xMax - x0)));
  ctx.stroke();
  ctx.restore();
}
```

- [ ] **Step 4: Run tests (expect pass)**

Run: `npm test -- tests/unit/plot.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add tests/unit/plot.test.ts src/lib/plot.ts
git commit -m "feat(v2): port plot utilities (TDD on makePlotMap)"
```

---

## Task 11: useCanvas hook

**Files:**
- Create: `src/hooks/useCanvas.ts`

`drawAxes`, `drawCurve`, `drawPoint`, `drawTangent` are tested via Playwright e2e (canvas not supported in jsdom).

- [ ] **Step 1: Write the hook**

Write `src/hooks/useCanvas.ts`:
```ts
import { useCallback, useEffect, useRef } from 'react';

export type CanvasDrawFn = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
) => void;

export function useCanvas(draw: CanvasDrawFn) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    if (w === 0 || h === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    drawRef.current(ctx, w, h);
  }, []);

  useEffect(() => {
    render();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => render());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [render]);

  // Re-render whenever draw identity changes (i.e., dependent state changed)
  useEffect(() => {
    render();
  });

  return canvasRef;
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCanvas.ts
git commit -m "feat(v2): add useCanvas hook with DPR + ResizeObserver"
```

---

## Task 12: Plot component

**Files:**
- Create: `src/components/Plot.tsx`

- [ ] **Step 1: Write the component**

Write `src/components/Plot.tsx`:
```tsx
import { useCanvas, type CanvasDrawFn } from '../hooks/useCanvas';

interface PlotProps {
  draw: CanvasDrawFn;
  width?: number | string;
  height?: number | string;
  ariaLabel?: string;
}

export function Plot({ draw, width = '100%', height = 360, ariaLabel }: PlotProps) {
  const ref = useCanvas(draw);
  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={ariaLabel ?? 'グラフ'}
      style={{ width, height, display: 'block' }}
    />
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/Plot.tsx
git commit -m "feat(v2): add Plot component"
```

---

## Task 13: Slider, StepRow, Warn components

**Files:**
- Create: `src/components/Slider.tsx`, `src/components/StepRow.tsx`, `src/components/Warn.tsx`

- [ ] **Step 1: Write Slider**

Write `src/components/Slider.tsx`:
```tsx
import { useId } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format = (v) => v.toFixed(2),
}: SliderProps) {
  const id = useId();
  return (
    <div className="mt-4">
      <label htmlFor={id} className="font-[var(--font-ui)] text-sm">
        {label} = <span>{format(value)}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
```

- [ ] **Step 2: Write StepRow**

Write `src/components/StepRow.tsx`:
```tsx
import { MathJax } from 'better-react-mathjax';

interface StepRowProps {
  tex: string;
  highlight?: boolean;
  ghost?: boolean;
}

export function StepRow({ tex, highlight, ghost }: StepRowProps) {
  const cls = [
    'py-1',
    highlight ? 'bg-accent-soft px-2 rounded' : '',
    ghost ? 'text-[var(--color-ghost)]' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={cls}>
      <MathJax dynamic>{`\\(${tex}\\)`}</MathJax>
    </div>
  );
}
```

- [ ] **Step 3: Write Warn**

Write `src/components/Warn.tsx`:
```tsx
interface WarnProps {
  children: React.ReactNode;
}

export function Warn({ children }: WarnProps) {
  return (
    <div role="alert" className="text-[var(--color-warn)] mt-2">
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Verify typecheck**

Run: `npm run typecheck`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add src/components/Slider.tsx src/components/StepRow.tsx src/components/Warn.tsx
git commit -m "feat(v2): add Slider, StepRow, Warn components"
```

---

## Task 14: App shell — MathJaxContext + HashRouter + Layout + Sidebar

**Files:**
- Create: `src/components/Sidebar.tsx`, `src/components/Layout.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write Sidebar**

Write `src/components/Sidebar.tsx`:
```tsx
import { NavLink } from 'react-router-dom';
import { ROUTES } from '../lib/constants';

export function Sidebar() {
  return (
    <aside
      className="font-[var(--font-ui)] text-sm"
      role="navigation"
      aria-label="例題メニュー"
    >
      {ROUTES.map((r) => (
        <NavLink
          key={r.path}
          to={`/${r.path}`}
          className={({ isActive }) =>
            [
              'block px-3 py-2 rounded text-[var(--color-ink-soft)] no-underline',
              isActive ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : '',
            ]
              .filter(Boolean)
              .join(' ')
          }
        >
          {r.label}
        </NavLink>
      ))}
    </aside>
  );
}
```

- [ ] **Step 2: Write Layout**

Write `src/components/Layout.tsx`:
```tsx
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <>
      <header className="border-b border-[var(--color-border)] px-6 py-4 font-[var(--font-ui)] font-semibold">
        Dual Numbers — Interactive
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 p-4 max-w-[1200px] mx-auto">
        <Sidebar />
        <main
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded p-6 min-h-[480px]"
          role="main"
          aria-live="polite"
        >
          <Outlet />
        </main>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Replace App.tsx with full shell**

Overwrite `src/App.tsx`:
```tsx
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import { Layout } from './components/Layout';

const mathjaxConfig = {
  loader: { load: ['input/tex', 'output/svg'] },
  tex: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
  svg: { fontCache: 'global' },
};

function Placeholder({ name }: { name: string }) {
  return <h2 className="font-[var(--font-ui)]">{name} (coming soon)</h2>;
}

export default function App() {
  return (
    <MathJaxContext version={3} config={mathjaxConfig} hideUntilTypeset="first">
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/intro" replace />} />
            <Route path="intro"        element={<Placeholder name="はじめに" />} />
            <Route path="poly"         element={<Placeholder name="多項式" />} />
            <Route path="trig"         element={<Placeholder name="三角関数 / Taylor" />} />
            <Route path="chain"        element={<Placeholder name="連鎖律" />} />
            <Route path="newton"       element={<Placeholder name="Newton 法" />} />
            <Route path="grad-descent" element={<Placeholder name="勾配降下" />} />
            <Route path="*"            element={<Navigate to="/intro" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </MathJaxContext>
  );
}
```

- [ ] **Step 4: Smoke test the shell with Playwright**

Run: `npm run test:e2e -- tests/e2e/sanity.spec.ts`
Expected: passes (root element non-empty).

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar.tsx src/components/Layout.tsx src/App.tsx
git commit -m "feat(v2): app shell with MathJaxContext, HashRouter, Layout, Sidebar"
```

---

## Task 15: Intro route

**Files:**
- Create: `src/routes/Intro.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write Intro.tsx**

Write `src/routes/Intro.tsx`:
```tsx
import { MathJax } from 'better-react-mathjax';

export function Intro() {
  return (
    <article className="prose max-w-none">
      <h2 className="font-[var(--font-ui)] mt-0">はじめに</h2>
      <p>
        <MathJax inline>{`\\(\\textbf{二重数 (dual number)}\\)`}</MathJax>{' '}
        は、<MathJax inline>{`\\(\\varepsilon^2 = 0\\)`}</MathJax> を満たす形式記号{' '}
        <MathJax inline>{`\\(\\varepsilon\\)`}</MathJax> を実数体に付加した{' '}
        <MathJax inline>{`\\(a + b\\varepsilon\\)`}</MathJax> の形の数です。
      </p>
      <p>
        関数 <MathJax inline>{`\\(f\\)`}</MathJax> に <MathJax inline>{`\\(x + \\varepsilon\\)`}</MathJax>{' '}
        を代入すると、Taylor 展開により{' '}
        <MathJax inline>{`\\(f(x + \\varepsilon) = f(x) + f'(x)\\varepsilon\\)`}</MathJax>{' '}
        となり、<strong>関数値と微分が同時に得られます</strong>。これが前進モード自動微分の核心です。
      </p>
      <p>左のメニューから例題を選んでください。</p>
    </article>
  );
}
```

- [ ] **Step 2: Mount Intro in App.tsx**

Modify `src/App.tsx`:
- Add import: `import { Intro } from './routes/Intro';`
- Replace `<Route path="intro" element={<Placeholder name="はじめに" />} />` with `<Route path="intro" element={<Intro />} />`

- [ ] **Step 3: Manual smoke**

Run: `npm run dev` (background), open `http://localhost:5173/#/intro`, verify:
- Sidebar visible
- "はじめに" heading
- Inline math rendered as SVG (no raw `\(...\)` text)

Stop dev server.

- [ ] **Step 4: Commit**

```bash
git add src/routes/Intro.tsx src/App.tsx
git commit -m "feat(v2): port Intro route"
```

---

## Task 16: Polynomial route — extracted compute (TDD) + RTL test

**Files:**
- Create: `tests/unit/poly.test.ts`, `src/lib/poly.ts`, `src/routes/Polynomial.tsx`, `tests/components/Polynomial.test.tsx`
- Modify: `src/App.tsx`

`compute` and `f` are extracted to `src/lib/poly.ts` so they're unit-tested independently of the React component (mirrors v1's `examples.poly.compute` tests).

- [ ] **Step 1: Write failing unit tests for poly.compute**

Write `tests/unit/poly.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { polyCompute, polyF } from '../../src/lib/poly';

const eq = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('polyF (f(x) = x^3 - 2x^2 + x - 1)', () => {
  it('f(2) = 8 - 8 + 2 - 1 = 1', () => expect(eq(polyF(2), 1)).toBe(true));
  it('f(0) = -1', () => expect(eq(polyF(0), -1)).toBe(true));
});

describe('polyCompute', () => {
  // Mirrors v1: poly compute: f(2) = 1, f'(2) = 5
  it('f(2) = 1, f\'(2) = 5', () => {
    const r = polyCompute(2);
    expect(eq(r.value, 1) && eq(r.derivative, 5)).toBe(true);
  });
  // Mirrors v1: poly compute: f(0) = -1, f'(0) = 1
  it('f(0) = -1, f\'(0) = 1', () => {
    const r = polyCompute(0);
    expect(eq(r.value, -1) && eq(r.derivative, 1)).toBe(true);
  });
});
```

- [ ] **Step 2: Run unit tests (expect failure)**

Run: `npm test -- tests/unit/poly.test.ts`
Expected: failures (module not found).

- [ ] **Step 3: Implement src/lib/poly.ts**

Write `src/lib/poly.ts`:
```ts
import { Dual } from './Dual';

// f(x) = x^3 - 2x^2 + x - 1
export const polyF = (x: number): number => x ** 3 - 2 * x ** 2 + x - 1;

export interface PolyResult {
  value: number;
  derivative: number;
}

export function polyCompute(x: number): PolyResult {
  const X = Dual.v(x);
  const r = X.pow(3).sub(Dual.c(2).mul(X.pow(2))).add(X).sub(Dual.c(1));
  return { value: r.re, derivative: r.du };
}
```

- [ ] **Step 4: Run unit tests (expect pass)**

Run: `npm test -- tests/unit/poly.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Write failing RTL test**

Write `tests/components/Polynomial.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import { Polynomial } from '../../src/routes/Polynomial';

function renderPoly() {
  return render(
    <MathJaxContext version={3}>
      <MemoryRouter>
        <Polynomial />
      </MemoryRouter>
    </MathJaxContext>,
  );
}

describe('Polynomial route', () => {
  it('shows the heading', () => {
    renderPoly();
    expect(screen.getByRole('heading', { name: /多項式/ })).toBeInTheDocument();
  });

  it('updates value/derivative display when slider moves to x=2', () => {
    renderPoly();
    const slider = screen.getByLabelText(/x =/) as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '2' } });
    // f(2) = 1, f'(2) = 5  → fmt3 formats as '1.000' / '5.000'
    expect(screen.getByTestId('value')).toHaveTextContent('1.000');
    expect(screen.getByTestId('derivative')).toHaveTextContent('5.000');
  });
});
```

- [ ] **Step 6: Run RTL test (expect failure)**

Run: `npm test -- tests/components/Polynomial.test.tsx`
Expected: failures (Polynomial route does not exist yet).

- [ ] **Step 7: Implement Polynomial.tsx**

Write `src/routes/Polynomial.tsx`:
```tsx
import { useState } from 'react';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { drawAxes, drawCurve, drawPoint, drawTangent, makePlotMap } from '../lib/plot';
import { fmt3 } from '../lib/format';
import { polyCompute, polyF } from '../lib/poly';

export function Polynomial() {
  const [x, setX] = useState(1);
  const { value, derivative } = polyCompute(x);

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const cs = getComputedStyle(document.documentElement);
    const border = cs.getPropertyValue('--color-border').trim() || '#e8e6e0';
    const curve = cs.getPropertyValue('--color-curve').trim() || '#1a1a1a';
    const m = makePlotMap({ xMin: -3, xMax: 3, yMin: -10, yMax: 10, w, h });
    drawAxes(ctx, m, border);
    drawCurve(ctx, m, polyF, { color: curve });
    drawTangent(ctx, m, x, value, derivative);
    drawPoint(ctx, m, x, value);
  };

  return (
    <article>
      <h2 className="font-[var(--font-ui)] mt-0">多項式</h2>
      <p>
        f(x) = x³ - 2x² + x - 1 を二重数で計算し、関数値と微分を同時に得ます。
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-4">
        <div>
          <Slider label="x" value={x} min={-3} max={3} step={0.05} onChange={setX} />
          <div className="mt-4 space-y-1">
            <StepRow tex={`x = ${fmt3(x)}`} />
            <StepRow tex={`f(x) = ${fmt3(value)}`} highlight />
            <StepRow tex={`f'(x) = ${fmt3(derivative)}`} highlight />
          </div>
          <div className="mt-2 text-sm text-[var(--color-ink-soft)]">
            <span data-testid="value">{fmt3(value)}</span>
            {' / '}
            <span data-testid="derivative">{fmt3(derivative)}</span>
          </div>
        </div>
        <Plot draw={draw} ariaLabel="f(x) と接線" />
      </div>
    </article>
  );
}
```

- [ ] **Step 8: Mount in App.tsx**

Modify `src/App.tsx`:
- Add import: `import { Polynomial } from './routes/Polynomial';`
- Replace the `poly` route element with `<Polynomial />`

- [ ] **Step 9: Run RTL test (expect pass)**

Run: `npm test -- tests/components/Polynomial.test.tsx`
Expected: passes.

- [ ] **Step 10: Manual smoke (canvas verification — jsdom can't)**

Run: `npm run dev`, navigate to `#/poly`, verify slider updates curve / tangent / values.

- [ ] **Step 11: Commit**

```bash
git add tests/unit/poly.test.ts src/lib/poly.ts src/routes/Polynomial.tsx tests/components/Polynomial.test.tsx src/App.tsx
git commit -m "feat(v2): port Polynomial route with extracted poly lib (TDD) + RTL"
```

---

## Task 17: Trig route (sin / cos / exp + Taylor terms)

**Files:**
- Create: `tests/unit/taylor.test.ts`, `src/lib/taylor.ts`, `src/routes/Trig.tsx`
- Modify: `src/App.tsx`

Calculation logic (`taylor`, `trueValue`) is extracted to `src/lib/taylor.ts` so it can be unit-tested independently of the route component (TDD), mirroring v1's `examples.trig.compute` tests.

- [ ] **Step 1: Write failing tests for taylor / trueValue**

Write `tests/unit/taylor.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { taylor, trueValue } from '../../src/lib/taylor';

const eq = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('trueValue', () => {
  it('sin(0) = 0', () => expect(eq(trueValue('sin', 0), 0)).toBe(true));
  it('cos(0) = 1', () => expect(eq(trueValue('cos', 0), 1)).toBe(true));
  it('exp(1) = e', () => expect(eq(trueValue('exp', 1), Math.E)).toBe(true));
});

describe('taylor (1 term)', () => {
  // Mirrors v1 tests:
  //   trig compute sin: f(0)=0, f'(0)=1
  //   trig compute exp: f(1)=e, f'(1)=e
  it('sin at x=0, terms=1 → value=0, derivative=1', () => {
    const r = taylor('sin', 0, 1);
    expect(eq(r.value, 0) && eq(r.derivative, 1)).toBe(true);
  });
  it('exp at x=1, terms=1 → value=e, derivative=e', () => {
    const r = taylor('exp', 1, 1);
    expect(eq(r.value, Math.E) && eq(r.derivative, Math.E)).toBe(true);
  });
});

describe('taylor (high-order convergence)', () => {
  it('sin at x=π/2 with 10 terms ≈ 1', () => {
    const r = taylor('sin', Math.PI / 2, 10);
    expect(Math.abs(r.value - 1) < 1e-6).toBe(true);
  });
  it('cos at x=0 with 10 terms = 1', () => {
    const r = taylor('cos', 0, 10);
    expect(eq(r.value, 1)).toBe(true);
  });
  it('exp derivative equals value (d/dx e^x = e^x)', () => {
    const r = taylor('exp', 0.5, 10);
    expect(Math.abs(r.derivative - r.value) < 1e-9).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests (expect failure)**

Run: `npm test -- tests/unit/taylor.test.ts`
Expected: failures — module not found.

- [ ] **Step 3: Implement src/lib/taylor.ts**

Write `src/lib/taylor.ts`:
```ts
import { Dual } from './Dual';

export type TrigFn = 'sin' | 'cos' | 'exp';

export function trueValue(fn: TrigFn, x: number): number {
  if (fn === 'sin') return Math.sin(x);
  if (fn === 'cos') return Math.cos(x);
  return Math.exp(x);
}

export interface TaylorResult {
  value: number;
  derivative: number;
}

// Taylor partial sum at 0, evaluated at x. Uses Dual so derivative is exact.
export function taylor(fn: TrigFn, x: number, terms: number): TaylorResult {
  const X = Dual.v(x);
  let sum = Dual.c(0);
  let factorial = 1;
  for (let n = 0; n < terms; n++) {
    if (n > 0) factorial *= n;
    let coef = 0;
    if (fn === 'exp') coef = 1;
    else if (fn === 'sin') coef = n % 4 === 1 ? 1 : n % 4 === 3 ? -1 : 0;
    else /* cos */ coef = n % 4 === 0 ? 1 : n % 4 === 2 ? -1 : 0;
    if (coef !== 0) {
      sum = sum.add(Dual.c(coef / factorial).mul(X.pow(n)));
    }
  }
  return { value: sum.re, derivative: sum.du };
}
```

- [ ] **Step 4: Run tests (expect pass)**

Run: `npm test -- tests/unit/taylor.test.ts`
Expected: 8 passed.

- [ ] **Step 5: Implement Trig.tsx (uses lib/taylor)**

Write `src/routes/Trig.tsx`:
```tsx
import { useState } from 'react';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { drawAxes, drawCurve, drawPoint, makePlotMap } from '../lib/plot';
import { fmt3 } from '../lib/format';
import { taylor, trueValue, type TrigFn } from '../lib/taylor';

export function Trig() {
  const [fn, setFn] = useState<TrigFn>('sin');
  const [terms, setTerms] = useState(3);
  const [x, setX] = useState(1);

  const t = taylor(fn, x, terms);
  const tv = trueValue(fn, x);

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const m = makePlotMap({ xMin: -4, xMax: 4, yMin: -2, yMax: 4, w, h });
    drawAxes(ctx, m);
    drawCurve(ctx, m, (xx) => trueValue(fn, xx), { color: '#1a1a1a' });
    drawCurve(ctx, m, (xx) => taylor(fn, xx, terms).value, { color: '#6b4eff', dash: [4, 3] });
    drawPoint(ctx, m, x, t.value);
  };

  return (
    <article>
      <h2 className="font-[var(--font-ui)] mt-0">三角関数 / Taylor</h2>
      <div className="flex gap-4 items-center mt-2">
        <label className="font-[var(--font-ui)] text-sm">
          関数:
          <select
            value={fn}
            onChange={(e) => setFn(e.target.value as TrigFn)}
            className="ml-2 border border-[var(--color-border)] rounded p-1"
          >
            <option value="sin">sin</option>
            <option value="cos">cos</option>
            <option value="exp">exp</option>
          </select>
        </label>
        <button
          onClick={() => setTerms((t) => Math.max(1, t - 1))}
          className="border border-[var(--color-border)] rounded px-2 py-1"
        >
          項数 -
        </button>
        <span>項数 = {terms}</span>
        <button
          onClick={() => setTerms((t) => Math.min(20, t + 1))}
          className="border border-[var(--color-border)] rounded px-2 py-1"
        >
          項数 +
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-4 mt-4">
        <div>
          <Slider label="x" value={x} min={-4} max={4} step={0.05} onChange={setX} />
          <div className="mt-4 space-y-1">
            <StepRow tex={`f(${fmt3(x)}) \\approx ${fmt3(t.value)}`} highlight />
            <StepRow tex={`f'(${fmt3(x)}) \\approx ${fmt3(t.derivative)}`} highlight />
            <StepRow tex={`\\text{真値}: ${fmt3(tv)}`} ghost />
          </div>
        </div>
        <Plot draw={draw} ariaLabel="関数と Taylor 近似" />
      </div>
    </article>
  );
}
```

- [ ] **Step 6: Mount in App.tsx**

Modify `src/App.tsx`:
- Add import: `import { Trig } from './routes/Trig';`
- Replace the `<Route path="trig" element={<Placeholder name="..." />} />` with `<Route path="trig" element={<Trig />} />`

- [ ] **Step 7: Manual smoke**

Run: `npm run dev`, navigate to `#/trig`. Verify:
- `sin`, x ≈ π/2 (1.55), terms = 10 → 値 ≈ 1.000
- `exp`, x = 1, terms = 10 → 値 ≈ 2.718
- Solid (true) and dashed (Taylor) curves both render; the dashed curve tightens around the solid one as terms increases

- [ ] **Step 8: Commit**

```bash
git add tests/unit/taylor.test.ts src/lib/taylor.ts src/routes/Trig.tsx src/App.tsx
git commit -m "feat(v2): port Trig route with extracted taylor lib (TDD)"
```

---

## Task 18: Chain rule route — extracted compute (TDD)

**Files:**
- Create: `tests/unit/chain.test.ts`, `src/lib/chain.ts`, `src/routes/Chain.tsx`
- Modify: `src/App.tsx`

`chainCompute` is extracted to `src/lib/chain.ts` (mirrors v1's `examples.chain.compute` tests).

- [ ] **Step 1: Write failing unit tests**

Write `tests/unit/chain.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { chainCompute } from '../../src/lib/chain';

const eq = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('chainCompute', () => {
  // Mirrors v1: chain compute sin(x^2) at x=1: value=sin(1), deriv=2cos(1)
  it('sin(x^2) at x=1 → value=sin(1), derivative=2cos(1)', () => {
    const r = chainCompute(1, 'sq', 'sin');
    expect(eq(r.value, Math.sin(1)) && eq(r.derivative, 2 * Math.cos(1))).toBe(true);
  });
  // Mirrors v1: chain compute exp(x^2) at x=1: value=e, deriv=2e
  it('exp(x^2) at x=1 → value=e, derivative=2e', () => {
    const r = chainCompute(1, 'sq', 'exp');
    expect(eq(r.value, Math.E) && eq(r.derivative, 2 * Math.E)).toBe(true);
  });
  it('log(x^3) at x=2 → value=ln(8), derivative=3/2', () => {
    const r = chainCompute(2, 'cube', 'log');
    expect(eq(r.value, Math.log(8)) && eq(r.derivative, 3 / 2)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests (expect failure)**

Run: `npm test -- tests/unit/chain.test.ts`
Expected: failures.

- [ ] **Step 3: Implement src/lib/chain.ts**

Write `src/lib/chain.ts`:
```ts
import { Dual } from './Dual';

export type Inner = 'sq' | 'cube' | 'sin';
export type Outer = 'sin' | 'exp' | 'log';

function applyInner(d: Dual, k: Inner): Dual {
  if (k === 'sq')   return d.pow(2);
  if (k === 'cube') return d.pow(3);
  return d.sin();
}
function applyOuter(d: Dual, k: Outer): Dual {
  if (k === 'sin') return d.sin();
  if (k === 'exp') return d.exp();
  return d.log();
}

export interface ChainResult {
  value: number;
  derivative: number;
}

export function chainCompute(x: number, inner: Inner, outer: Outer): ChainResult {
  const r = applyOuter(applyInner(Dual.v(x), inner), outer);
  return { value: r.re, derivative: r.du };
}
```

- [ ] **Step 4: Run tests (expect pass)**

Run: `npm test -- tests/unit/chain.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Implement Chain.tsx (uses lib/chain)**

Write `src/routes/Chain.tsx`:
```tsx
import { useState } from 'react';
import { Plot } from '../components/Plot';
import { Slider } from '../components/Slider';
import { StepRow } from '../components/StepRow';
import { drawAxes, drawCurve, drawPoint, makePlotMap } from '../lib/plot';
import { fmt3 } from '../lib/format';
import { chainCompute, type Inner, type Outer } from '../lib/chain';

export function Chain() {
  const [inner, setInner] = useState<Inner>('sq');
  const [outer, setOuter] = useState<Outer>('sin');
  const [x, setX] = useState(1);
  const r = chainCompute(x, inner, outer);
  const fnAt = (xx: number) => chainCompute(xx, inner, outer).value;

  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const m = makePlotMap({ xMin: -3, xMax: 3, yMin: -3, yMax: 3, w, h });
    drawAxes(ctx, m);
    drawCurve(ctx, m, fnAt, { color: '#1a1a1a' });
    drawPoint(ctx, m, x, r.value);
  };

  const select = <T extends string>(value: T, onChange: (v: T) => void, options: T[]) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="border border-[var(--color-border)] rounded p-1"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );

  return (
    <article>
      <h2 className="font-[var(--font-ui)] mt-0">連鎖律</h2>
      <div className="flex gap-3 items-center mt-2">
        <span>inner:</span> {select<Inner>(inner, setInner, ['sq', 'cube', 'sin'])}
        <span>outer:</span> {select<Outer>(outer, setOuter, ['sin', 'exp', 'log'])}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_600px] gap-4 mt-4">
        <div>
          <Slider label="x" value={x} min={-3} max={3} step={0.05} onChange={setX} />
          <div className="mt-4 space-y-1">
            <StepRow tex={`f(${fmt3(x)}) = ${fmt3(r.value)}`} highlight />
            <StepRow tex={`f'(${fmt3(x)}) = ${fmt3(r.derivative)}`} highlight />
          </div>
        </div>
        <Plot draw={draw} ariaLabel="合成関数" />
      </div>
    </article>
  );
}
```

- [ ] **Step 6: Mount in App.tsx**

Add import + route element for `Chain`.

- [ ] **Step 7: Manual smoke**

Run: `npm run dev`, navigate to `#/chain`, change inner/outer/x, verify computation.

- [ ] **Step 8: Commit**

```bash
git add tests/unit/chain.test.ts src/lib/chain.ts src/routes/Chain.tsx src/App.tsx
git commit -m "feat(v2): port Chain rule route with extracted chain lib (TDD)"
```

---

## Task 19: Newton route — extracted step (TDD) + RTL test

**Files:**
- Create: `tests/unit/newton.test.ts`, `src/lib/newton.ts`, `src/routes/Newton.tsx`, `tests/components/Newton.test.tsx`
- Modify: `src/App.tsx`

f(x) = x³ - 2x - 5 (現行と同一). `newtonStep` extracted to `src/lib/newton.ts` (mirrors v1's `examples.newton.step` tests).

- [ ] **Step 1: Write failing unit tests**

Write `tests/unit/newton.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { newtonStep } from '../../src/lib/newton';

const eq = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('newtonStep', () => {
  // Mirrors v1: newton step from x=2 toward root of x^3-2x-5 → x=2.1, f=-1, df=10
  it('step from x=2: x\'=2.1, f=-1, df=10', () => {
    const r = newtonStep(2);
    expect(eq(r.x, 2.1) && eq(r.fx, -1) && eq(r.dfx, 10)).toBe(true);
  });
  // Mirrors v1: newton converges from x=2 in <10 steps
  it('converges from x=2 in <10 steps (residual < 1e-9)', () => {
    let x = 2;
    for (let i = 0; i < 10; i++) x = newtonStep(x).x;
    expect(Math.abs(x ** 3 - 2 * x - 5) < 1e-9).toBe(true);
  });
});
```

- [ ] **Step 2: Run unit tests (expect failure)**

Run: `npm test -- tests/unit/newton.test.ts`
Expected: failures.

- [ ] **Step 3: Implement src/lib/newton.ts**

Write `src/lib/newton.ts`:
```ts
import { Dual } from './Dual';

export interface NewtonStep {
  x: number;       // x_{n+1} (after applying the update)
  fx: number;      // f(x_n)
  dfx: number;     // f'(x_n)
  prev: number;    // x_n
}

// f(x) = x^3 - 2x - 5
export function newtonStep(prev: number): NewtonStep {
  const X = Dual.v(prev);
  const r = X.pow(3).sub(Dual.c(2).mul(X)).sub(Dual.c(5));
  const fx = r.re;
  const dfx = r.du;
  return { prev, fx, dfx, x: prev - fx / dfx };
}
```

> Note: v1's test used `r.x` to mean "next x value" (the tested expectation `r.x === 2.1` is the value after one Newton update from x=2). We preserve that semantics: `x` = next, `prev` = before.

- [ ] **Step 4: Run unit tests (expect pass)**

Run: `npm test -- tests/unit/newton.test.ts`
Expected: 2 passed.

- [ ] **Step 5: Write failing RTL test**

Write `tests/components/Newton.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import { Newton } from '../../src/routes/Newton';

function renderNewton() {
  return render(
    <MathJaxContext version={3}>
      <MemoryRouter>
        <Newton />
      </MemoryRouter>
    </MathJaxContext>,
  );
}

describe('Newton route', () => {
  it('adds an iteration row when "次のステップ" clicked', async () => {
    const user = userEvent.setup();
    renderNewton();
    const before = screen.queryAllByTestId('newton-step').length;
    await user.click(screen.getByRole('button', { name: /次のステップ/ }));
    expect(screen.queryAllByTestId('newton-step').length).toBe(before + 1);
  });

  it('reset button clears history', async () => {
    const user = userEvent.setup();
    renderNewton();
    await user.click(screen.getByRole('button', { name: /次のステップ/ }));
    await user.click(screen.getByRole('button', { name: /次のステップ/ }));
    await user.click(screen.getByRole('button', { name: /リセット/ }));
    expect(screen.queryAllByTestId('newton-step')).toHaveLength(0);
  });
});
```

- [ ] **Step 6: Run RTL test (expect failure)**

Run: `npm test -- tests/components/Newton.test.tsx`
Expected: failures.

- [ ] **Step 7: Implement Newton.tsx**

Write `src/routes/Newton.tsx`:
```tsx
import { useState } from 'react';
import { StepRow } from '../components/StepRow';
import { Slider } from '../components/Slider';
import { fmt3 } from '../lib/format';
import { newtonStep, type NewtonStep as Step } from '../lib/newton';

export function Newton() {
  const [x0, setX0] = useState(2);
  const [steps, setSteps] = useState<Step[]>([]);

  const current = steps.length > 0 ? steps[steps.length - 1].x : x0;

  const advance = () => {
    setSteps((s) => [...s, newtonStep(s.length === 0 ? x0 : s[s.length - 1].x)]);
  };
  const reset = () => setSteps([]);
  const converge = () => {
    const s: Step[] = [];
    let xc = x0;
    for (let i = 0; i < 20; i++) {
      const step = newtonStep(xc);
      s.push(step);
      if (Math.abs(step.fx) < 1e-9) break;
      xc = step.x;
    }
    setSteps(s);
  };

  return (
    <article>
      <h2 className="font-[var(--font-ui)] mt-0">Newton 法</h2>
      <p>
        f(x) = x³ - 2x - 5 の根を Newton 法で求めます。微分は二重数で自動計算。
      </p>
      <Slider
        label="x₀"
        value={x0}
        min={-3}
        max={3}
        step={0.1}
        onChange={(v) => {
          setX0(v);
          setSteps([]);
        }}
      />
      <div className="flex gap-2 mt-3">
        <button onClick={advance} className="border border-[var(--color-border)] rounded px-3 py-1">
          次のステップ
        </button>
        <button onClick={converge} className="border border-[var(--color-border)] rounded px-3 py-1">
          収束まで
        </button>
        <button onClick={reset} className="border border-[var(--color-border)] rounded px-3 py-1">
          リセット
        </button>
      </div>
      <div className="mt-4 space-y-1">
        <StepRow tex={`x_{\\text{current}} = ${fmt3(current)}`} ghost />
        {steps.map((s, i) => (
          <div key={i} data-testid="newton-step">
            <StepRow
              tex={`x_{${i}} = ${fmt3(s.prev)},\\quad f = ${fmt3(s.fx)},\\quad f' = ${fmt3(s.dfx)},\\quad x_{${i + 1}} = ${fmt3(s.x)}`}
            />
          </div>
        ))}
      </div>
    </article>
  );
}
```

- [ ] **Step 8: Mount in App.tsx**

Add import + route element for `Newton`.

- [ ] **Step 9: Run RTL test (expect pass)**

Run: `npm test -- tests/components/Newton.test.tsx`
Expected: passes.

- [ ] **Step 10: Manual smoke**

Run: `npm run dev`, navigate `#/newton`, click "次のステップ" 3 times, verify rows accumulate.

- [ ] **Step 11: Commit**

```bash
git add tests/unit/newton.test.ts src/lib/newton.ts src/routes/Newton.tsx tests/components/Newton.test.tsx src/App.tsx
git commit -m "feat(v2): port Newton method route with extracted newton lib (TDD) + RTL"
```

---

## Task 20: Gradient descent route — extracted step (TDD) + RTL test (divergence)

**Files:**
- Create: `tests/unit/grad.test.ts`, `src/lib/grad.ts`, `src/routes/GradDescent.tsx`, `tests/components/GradDescent.test.tsx`
- Modify: `src/App.tsx`

f(x) = (x - 2)² + 1 (現行と同一). `gradStep` extracted to `src/lib/grad.ts` (mirrors v1's `examples.gradDescent.step` tests).

- [ ] **Step 1: Write failing unit tests**

Write `tests/unit/grad.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { gradStep } from '../../src/lib/grad';

const eq = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

describe('gradStep (f(x) = (x-2)^2 + 1)', () => {
  // Mirrors v1: grad step from x=5, eta=0.1: f'=6, x'=4.4
  it('from x=5, eta=0.1 → df=6, x_next=4.4', () => {
    const r = gradStep(5, 0.1);
    expect(eq(r.dfx, 6) && eq(r.x, 4.4)).toBe(true);
  });
  // Mirrors v1: grad converges to x=2 in 100 steps with eta=0.1
  it('converges to x=2 in 100 steps with eta=0.1', () => {
    let x = 5;
    for (let i = 0; i < 100; i++) x = gradStep(x, 0.1).x;
    expect(Math.abs(x - 2) < 1e-3).toBe(true);
  });
  it('eta=1.2 (overshoot) sends x past 1e6 within ~80 steps', () => {
    let x = 5;
    let i = 0;
    for (; i < 200; i++) {
      x = gradStep(x, 1.2).x;
      if (!Number.isFinite(x) || Math.abs(x) > 1e6) break;
    }
    expect(Math.abs(x) > 1e6 || !Number.isFinite(x)).toBe(true);
    expect(i).toBeLessThan(150);
  });
});
```

- [ ] **Step 2: Run unit tests (expect failure)**

Run: `npm test -- tests/unit/grad.test.ts`
Expected: failures.

- [ ] **Step 3: Implement src/lib/grad.ts**

Write `src/lib/grad.ts`:
```ts
import { Dual } from './Dual';

export interface GradStepResult {
  x: number;       // x_{n+1}
  fx: number;      // f(x_n)
  dfx: number;     // f'(x_n)
  prev: number;    // x_n
  eta: number;
}

// f(x) = (x - 2)^2 + 1
export function gradStep(prev: number, eta: number): GradStepResult {
  const r = Dual.v(prev).sub(Dual.c(2)).pow(2).add(Dual.c(1));
  const fx = r.re;
  const dfx = r.du;
  return { prev, eta, fx, dfx, x: prev - eta * dfx };
}

export const isDiverged = (r: GradStepResult): boolean =>
  Math.abs(r.x) > 1e6 || !Number.isFinite(r.fx) || !Number.isFinite(r.x);
```

> Note: v1's test used `r.x` to mean "next x value" (e.g., `r.x === 4.4` after one step from x=5 with η=0.1). We preserve that semantics.

- [ ] **Step 4: Run unit tests (expect pass)**

Run: `npm test -- tests/unit/grad.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Write failing RTL test**

Write `tests/components/GradDescent.test.tsx`:
```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MathJaxContext } from 'better-react-mathjax';
import { GradDescent } from '../../src/routes/GradDescent';

function renderGD() {
  return render(
    <MathJaxContext version={3}>
      <MemoryRouter>
        <GradDescent />
      </MemoryRouter>
    </MathJaxContext>,
  );
}

describe('GradDescent route', () => {
  it('shows divergence warning when eta is large and steps run', async () => {
    const user = userEvent.setup();
    renderGD();
    const etaSlider = screen.getByLabelText(/η =/) as HTMLInputElement;
    fireEvent.change(etaSlider, { target: { value: '1.2' } });
    const stepBtn = screen.getByRole('button', { name: /次のステップ/ });
    for (let i = 0; i < 12; i++) await user.click(stepBtn);
    expect(screen.getByRole('alert')).toHaveTextContent(/発散/);
  });
});
```

- [ ] **Step 6: Run RTL test (expect failure)**

Run: `npm test -- tests/components/GradDescent.test.tsx`
Expected: failure.

- [ ] **Step 7: Implement GradDescent.tsx**

Write `src/routes/GradDescent.tsx`:
```tsx
import { useState } from 'react';
import { StepRow } from '../components/StepRow';
import { Slider } from '../components/Slider';
import { Warn } from '../components/Warn';
import { fmt3 } from '../lib/format';
import { gradStep, isDiverged, type GradStepResult } from '../lib/grad';

export function GradDescent() {
  const [x0, setX0] = useState(5);
  const [eta, setEta] = useState(0.1);
  const [history, setHistory] = useState<GradStepResult[]>([]);

  const advance = () => {
    setHistory((h) => {
      const prev = h.length === 0 ? x0 : h[h.length - 1].x;
      return [...h, gradStep(prev, eta)];
    });
  };
  const reset = () => setHistory([]);

  const last = history[history.length - 1];
  const diverged = last ? isDiverged(last) : false;

  return (
    <article>
      <h2 className="font-[var(--font-ui)] mt-0">勾配降下</h2>
      <p>f(x) = (x − 2)² + 1 を勾配降下で最小化。η が大きすぎると発散します。</p>
      <Slider
        label="x₀"
        value={x0}
        min={-5}
        max={10}
        step={0.1}
        onChange={(v) => { setX0(v); setHistory([]); }}
      />
      <Slider
        label="η"
        value={eta}
        min={0}
        max={1.5}
        step={0.01}
        onChange={(v) => { setEta(v); setHistory([]); }}
      />
      <div className="flex gap-2 mt-3">
        <button onClick={advance} className="border border-[var(--color-border)] rounded px-3 py-1">
          次のステップ
        </button>
        <button onClick={reset} className="border border-[var(--color-border)] rounded px-3 py-1">
          リセット
        </button>
      </div>
      {diverged && <Warn>発散しました。η を小さくしてください。</Warn>}
      <div className="mt-4 space-y-1">
        {history.map((s, i) => (
          <div key={i}>
            <StepRow
              tex={`x_{${i}} = ${fmt3(s.prev)},\\; f = ${fmt3(s.fx)},\\; f' = ${fmt3(s.dfx)},\\; x_{${i + 1}} = ${fmt3(s.x)}`}
            />
          </div>
        ))}
      </div>
    </article>
  );
}
```

- [ ] **Step 8: Mount in App.tsx**

Add import + route element for `GradDescent`. At this point, replace ALL remaining `<Placeholder>` references; remove the `Placeholder` helper (no longer used).

- [ ] **Step 9: Run RTL test (expect pass)**

Run: `npm test -- tests/components/GradDescent.test.tsx`
Expected: passes (alert shown after large-η steps).

- [ ] **Step 10: Run full test suite**

Run: `npm test`
Expected: all tests pass (Dual 16 + format 6 + plot 3 + taylor 8 + poly 4 + chain 3 + newton 2 + grad 3 + Polynomial RTL 2 + Newton RTL 2 + GradDescent RTL 1 + sanity 1 = 51 tests; satisfies spec NF-2 ≥ 27).

- [ ] **Step 11: Manual smoke**

Run: `npm run dev`, navigate `#/grad-descent`, set η=1.2, click step 12 times, observe `[role="alert"]` with 発散 text.

- [ ] **Step 12: Commit**

```bash
git add tests/unit/grad.test.ts src/lib/grad.ts src/routes/GradDescent.tsx tests/components/GradDescent.test.tsx src/App.tsx
git commit -m "feat(v2): port GradDescent route with extracted grad lib (TDD) + RTL"
```

---

## Task 21: e2e smoke spec (route sweep, interactions, divergence)

**Files:**
- Create: `tests/e2e/smoke.spec.ts`
- Delete: `tests/e2e/sanity.spec.ts`

- [ ] **Step 1: Remove sanity test**

Run: `rm tests/e2e/sanity.spec.ts`

- [ ] **Step 2: Write smoke spec**

Write `tests/e2e/smoke.spec.ts`:
```ts
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
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  await gotoHash(page, '/poly');
  const polySlider = page.locator('main input[type=range]').first();
  await polySlider.fill('-2');
  await polySlider.fill('1.5');

  await gotoHash(page, '/trig');
  await page.locator('main select').first().selectOption('exp');

  await gotoHash(page, '/newton');
  const nextBtn = page.getByRole('button', { name: /次のステップ/ });
  for (let i = 0; i < 3; i++) await nextBtn.click();

  expect(errors, errors.join('\n')).toEqual([]);
});

test('divergence warning shows after 8 steps with η=1.2', async ({ page }) => {
  await gotoHash(page, '/grad-descent');
  const etaSlider = page.locator('main input[type=range]').nth(1);
  await etaSlider.fill('1.2');
  const stepBtn = page.getByRole('button', { name: /次のステップ/ });
  for (let i = 0; i < 10; i++) await stepBtn.click();
  await expect(page.getByRole('alert')).toContainText('発散');
});
```

- [ ] **Step 3: Run e2e**

Run: `npm run test:e2e`
Expected: all passes.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/smoke.spec.ts
git rm tests/e2e/sanity.spec.ts
git commit -m "feat(v2): port e2e smoke spec (route sweep, interactions, divergence)"
```

---

## Task 22: ESLint config + lint pass

**Files:**
- Create: `eslint.config.js`

- [ ] **Step 1: Write ESLint config**

Write `eslint.config.js`:
```js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'docs/legacy'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
);
```

- [ ] **Step 2: Install missing eslint plugin**

Run: `npm i -D globals`

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: 0 errors. Fix any reported.

- [ ] **Step 4: Commit**

```bash
git add eslint.config.js package.json package-lock.json
git commit -m "feat(v2): add ESLint flat config"
```

---

## Task 23: README, CHANGELOG update, CI workflow, Vercel config

**Files:**
- Modify: `README.md`, `CHANGELOG.md`
- Create: `.github/workflows/ci.yml`, `vercel.json` (optional)

- [ ] **Step 1: Update README.md**

Overwrite `README.md`:
```markdown
# Dual Numbers — Interactive

二重数 (dual numbers) を用いた前進モード自動微分の対話型デモ。
React + TypeScript + Vite + Tailwind v4 + better-react-mathjax で実装。

## 開発

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # Vitest (unit + RTL components)
npm run test:e2e     # Playwright (chromium)
npm run typecheck
npm run lint
npm run build
```

## アーキテクチャ

- ルーティング: HashRouter (`#/intro` etc., 6 routes)
- 状態: 各 route の useState、共有状態なし
- 数式: better-react-mathjax (`<MathJax dynamic>`)
- 描画: `useCanvas` hook + 純関数 `drawAxes`/`drawCurve`/`drawTangent`

## デプロイ

Vercel: フレームワークプリセット **Vite** で自動検出、設定不要。

## 履歴

- v1.0.0 (2026-05-10): 単一ファイル vanilla HTML/JS 版 (`docs/legacy/index.html` and tag `v1.0.0`)
- v2.0.0 (作業中): React + TypeScript + Vite 版

詳細: [`CHANGELOG.md`](./CHANGELOG.md), 設計: [`docs/superpowers/specs/`](./docs/superpowers/specs/)

## License

MIT (see [LICENSE](./LICENSE))
```

- [ ] **Step 2: Update CHANGELOG.md**

Modify `CHANGELOG.md` — replace the `## [Unreleased]` block with:
```markdown
## [2.0.0] - 2026-05-10

### Changed (faithful port)
- Migrated from single-file vanilla HTML/JS to Vite + React 18 + TypeScript + Tailwind v4
- All 6 routes (`/intro`, `/poly`, `/trig`, `/chain`, `/newton`, `/grad-descent`) preserve v1 URLs via HashRouter
- MathJax integrated via `better-react-mathjax`
- Tests: Vitest + React Testing Library (unit + component) and Playwright (e2e)
- v1 source preserved at `docs/legacy/index.html` and git tag `v1.0.0`

### Identical to v1
- Visual design, design tokens, content, mathematical examples, behaviors

```

- [ ] **Step 3: Add CI workflow**

Write `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main, feat/v2]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - run: npm run build
```

- [ ] **Step 4: Run full local pipeline**

Run: `npm run typecheck && npm run lint && npm test && npm run test:e2e && npm run build`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add README.md CHANGELOG.md .github/workflows/ci.yml
git commit -m "docs(v2): update README, CHANGELOG; add CI workflow"
```

---

## Task 24: Lighthouse a11y audit + Vercel preview + final tag

**Files:**
- (Possibly) `src/index.css` — color contrast fixes if Lighthouse flags any
- Modify: `package.json` (version bump)

- [ ] **Step 1: Build production bundle**

Run: `npm run build && npm run preview`
Browser: open `http://localhost:4173`.

- [ ] **Step 2: Run Lighthouse Accessibility audit**

Use chrome-devtools-mcp (preferred) or Chrome DevTools manually:
- chrome-devtools-mcp: `new_page` → `navigate_page` to `http://localhost:4173/#/intro` → `lighthouse_audit` (categories=`['accessibility']`)
- Repeat for `#/poly` and `#/grad-descent` (these had the most chrome in v1)

Target: Accessibility ≥ 95 on each (goal: 100).

- [ ] **Step 3: Fix any color-contrast or label issues**

If `audits['color-contrast'].details.items` is non-empty, fix the offending CSS variable in `src/index.css` (recall v1 had to change `--accent: #6b4eff` → `#5538e8`; this should already be inherited).
If labels are missing, add them in the relevant component.
Re-run audit until ≥ 95.

- [ ] **Step 4: Bump version**

Modify `package.json`: `"version": "2.0.0-dev"` → `"version": "2.0.0"`.

- [ ] **Step 5: Final test pass**

Run: `npm run typecheck && npm run lint && npm test && npm run test:e2e && npm run build`
Expected: all green.

- [ ] **Step 6: Commit and merge**

```bash
git add package.json src/index.css 2>/dev/null
git commit -m "chore(v2): bump to 2.0.0 after Lighthouse audit" --allow-empty
git checkout main
git merge --no-ff feat/v2 -m "feat: v2 — Vite + React + TypeScript migration"
git tag -a v2.0.0 -m "v2.0.0: Vite + React + TypeScript port"
git push origin main
git push origin v2.0.0
```

- [ ] **Step 7: Verify Vercel deploy**

If the GitHub repo is connected to Vercel, the push to `main` triggers a deploy. If not connected:
- Run: `npx vercel --prod` (or import the repo in Vercel dashboard, framework: Vite, build command: `npm run build`, output: `dist`)

Open the production URL and verify all 6 routes work, MathJax typesets, slider operations don't error.

- [ ] **Step 8: GitHub Release**

```bash
gh release create v2.0.0 --title "v2.0.0 — Vite + React + TypeScript port" --notes-file <(sed -n '/## \[2.0.0\]/,/## \[1.0.0\]/p' CHANGELOG.md | sed '$d')
```

---

## Self-Review (post-write checklist completed)

**Spec coverage:** Each requirement R-1..R-8, NF-1..NF-6 maps to tasks:
- R-1 (6 routes, hash URLs): Task 14 (HashRouter) + Tasks 15-20 (each route)
- R-2 (sidebar nav): Task 14 (Sidebar with NavLink + aria-current via `isActive`)
- R-3 (same content per route): Tasks 15-20
- R-4 (interactive controls): Slider/select/buttons in Tasks 13, 17, 19, 20
- R-5 (divergence warning): Task 20
- R-6 (MathJax typeset): Task 14 (MathJaxContext) + StepRow (Task 13)
- R-7 (canvas DPR + resize): Task 11 (useCanvas)
- R-8 (color tokens preserved): Task 3
- NF-1 (a11y ≥ 95): Task 24
- NF-2 (test stack ≥ 27 unit): Dual 16 + format 6 + plot 3 + taylor 8 + poly 4 + chain 3 + newton 2 + grad 3 = **45 unit tests** in Tasks 7-10, 16-20 (plus 5 component RTL + e2e in Tasks 16, 19, 20, 21). Comfortably ≥ 27.
- NF-3 (strict TS): Task 2
- NF-4 (build / Vercel): Tasks 2, 24
- NF-5 (CI): Task 23
- NF-6 (bundle size): Implicit in Task 24 production build inspection (no explicit bundle gate; YAGNI'd into a manual check during preview)

**Pure-logic extraction pattern:** Every example route extracts its compute/step function to `src/lib/<topic>.ts` (taylor, poly, chain, newton, grad) and unit-tests it independently of React. Mirrors v1's per-example unit tests (`examples.poly.compute`, `examples.newton.step`, etc.) and keeps route components thin.

**Type consistency check:**
- `Dual.re/du` (not `a/b`)
- compute-style results (Polynomial, Chain, Trig/taylor) return `{ value, derivative }`
- step-style results (Newton, GradDescent) return `{ prev, x, fx, dfx, ... }` where `x` = next x (matches v1 test semantics; `prev` was added so the route can render `x_n` in the step row)
- `makePlotMap` returns `PlotMap`

**No placeholders:** All "TBD"/"TODO" removed; every step has explicit code or commands.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-10-vite-react-migration.md`. Two execution options:

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
