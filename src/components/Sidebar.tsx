import { NavLink } from 'react-router-dom';
import { ROUTES } from '../lib/constants';

export function Sidebar() {
  return (
    <nav
      className="[font-family:var(--font-ui)] text-sm leading-[1.6]"
      aria-label="例題メニュー"
    >
      {ROUTES.map((r) => (
        <NavLink
          key={r.path}
          to={`/${r.path}`}
          className={({ isActive }) =>
            isActive
              ? 'block px-3 py-2 rounded no-underline bg-[var(--color-accent-soft)] [color:var(--color-accent)]'
              : 'block px-3 py-2 rounded no-underline [color:var(--color-ink-soft)]'
          }
        >
          {r.label}
        </NavLink>
      ))}
    </nav>
  );
}
