import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <>
      <header className="border-b border-[var(--color-border)] px-6 py-4 [font-family:var(--font-ui)] font-semibold">
        <h1 className="m-0 text-base font-semibold">Dual Numbers — Interactive</h1>
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
