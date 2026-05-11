# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-05-10

### Changed (faithful port)
- Migrated from single-file vanilla HTML/JS to Vite + React 18 + TypeScript + Tailwind v4
- All 6 routes (`/intro`, `/poly`, `/trig`, `/chain`, `/newton`, `/grad-descent`) preserve v1 URLs via HashRouter
- MathJax integrated via `better-react-mathjax`
- Tests: Vitest + React Testing Library (unit + component) and Playwright (e2e)
- v1 source preserved at `docs/legacy/index.html` and git tag `v1.0.0`

### Identical to v1
- Visual design, design tokens, content, mathematical examples, behaviors

## [1.0.0] - 2026-05-10

Initial release: single-file vanilla HTML/JS SPA with 6 interactive examples
of forward-mode automatic differentiation using dual numbers (`Dual` class).
Lighthouse Accessibility 100. 27 in-page unit tests + Playwright smoke suite.

Source preserved at `docs/legacy/index.html` and git tag `v1.0.0`.
