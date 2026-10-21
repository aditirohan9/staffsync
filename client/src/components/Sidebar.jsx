import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { NAV_LINKS } from '../config/navLinks';

export default function Sidebar({ open, onNavigate }) {
  const { user } = useSelector((s) => s.auth);
  const links = NAV_LINKS.filter((l) => !l.roles || l.roles.includes(user.role));

  return (
    <aside className={`app-sidebar ${open ? 'open' : ''}`}>
      <ul className="nav flex-column p-2">
        {links.map((l) => (
          <li className="nav-item" key={l.to}>
            <NavLink
              to={l.to}
              onClick={onNavigate}
              className={({ isActive }) => `nav-link sidebar-link ${isActive ? 'active' : ''}`}
            >
              <i className={`bi ${l.icon} me-2`}></i>
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}
