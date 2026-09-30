import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

/*
 * Mirrors docs/legacy/index.html:L52-57 verbatim:
 *
 *   <header class="app-header">Dual Numbers — Interactive</header>
 *   <div class="layout">
 *     <aside class="sidebar" id="sidebar" role="navigation" aria-label="例題メニュー"></aside>
 *     <main class="main" id="main" role="main" aria-live="polite"></main>
 *   </div>
 *
 * The id attributes are kept even though React Router (not vanilla JS) drives
 * routing now — v1's <body> serialised this way and the v1↔v2 equality test
 * compares outerHTML, so attribute parity matters even where the v2 runtime
 * doesn't read them.
 */
export function Layout() {
  return (
    <>
      <header className="app-header">Dual Numbers — Interactive</header>
      <div className="layout">
        <Sidebar />
        <main className="main" id="main" role="main" aria-live="polite">
          <Outlet />
        </main>
      </div>
    </>
  );
}
