import { NavLink } from 'react-router-dom';
import { ROUTES } from '../lib/constants';

/*
 * Mirrors docs/legacy/index.html:L55 + buildSidebar() (L758-762) +
 * highlightSidebar() (L763-770).
 *
 * v1 markup per link (after highlightSidebar runs):
 *   <a href="#/intro" data-hash="#/intro" class="active" aria-current="page">導入</a>
 *
 * NavLink (HashRouter) auto-generates href="#/intro" and aria-current="page";
 * we supply class="active" via the className callback and data-hash explicitly
 * so the rendered DOM is byte-for-byte equivalent to v1.
 */
export function Sidebar() {
  return (
    <aside
      className="sidebar"
      id="sidebar"
      role="navigation"
      aria-label="例題メニュー"
    >
      {ROUTES.map((r) => (
        <NavLink
          key={r.path}
          to={`/${r.path}`}
          data-hash={`#/${r.path}`}
          className={({ isActive }) => (isActive ? 'active' : undefined)}
        >
          {r.label}
        </NavLink>
      ))}
    </aside>
  );
}
