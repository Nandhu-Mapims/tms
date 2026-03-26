import { NavLink, useLocation } from 'react-router-dom';
import { APP_NAME, APP_SUBTITLE, NAV_ITEMS } from '../../config/appConfig';
import { useAuth } from '../../hooks/useAuth';

function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const navigationItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));
  const pathname = location?.pathname ?? '';

  const isNavItemActive = (item) => {
    const path = String(item?.path ?? '');
    if (!path) return false;

    // Keep Tickets highlighted for list + details, but NOT for create page.
    if (path === '/tickets') {
      return pathname.startsWith('/tickets') && !pathname.startsWith('/tickets/create');
    }

    return pathname === path;
  };

  return (
    <aside className="app-sidebar d-flex flex-column p-3 border-end bg-white">
      <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom flex-shrink-0">
        <div className="sidebar-logo shadow-sm">
          <img src="/hospital-mark.svg" alt="Hospital logo" width="28" height="28" />
        </div>
        <div>
          <h1 className="h6 mb-0 fw-bold text-dark">{APP_NAME}</h1>
          <p className="small text-secondary mb-0">{APP_SUBTITLE}</p>
        </div>
      </div>

      <div className="small text-uppercase text-secondary fw-semibold mb-2 flex-shrink-0">Navigation</div>
      <nav className="nav flex-column gap-2 app-sidebar-nav">
        {navigationItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={() =>
              `nav-link app-nav-link d-flex align-items-center justify-content-between ${isNavItemActive(item) ? 'active' : ''}`
            }
          >
            <span className="d-flex align-items-center gap-2">
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </span>
            {item.disabled ? <span className="badge rounded-pill text-bg-light">Soon</span> : null}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}

export default Sidebar;
