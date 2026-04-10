import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopNavbar from './TopNavbar.jsx';

function MainLayout() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileNavOpen]);

  return (
    <div className="app-shell min-vh-100">
      {mobileNavOpen ? (
        <button
          type="button"
          className="app-sidebar-backdrop d-lg-none"
          aria-label="Close navigation menu"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}
      <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <div className="app-content-wrapper">
        <TopNavbar onMenuClick={() => setMobileNavOpen(true)} />
        <main className="app-content p-3 p-md-4 p-lg-5">
          <div className="app-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
