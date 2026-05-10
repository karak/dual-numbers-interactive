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
