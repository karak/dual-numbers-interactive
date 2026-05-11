import { NavLink } from 'react-router-dom';
import { ROUTES } from '../lib/constants';

export function Sidebar() {
  return (
    <nav
      className="[font-family:var(--font-ui)] text-sm"
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
    </nav>
  );
}
