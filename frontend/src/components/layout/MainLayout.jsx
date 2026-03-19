import Sidebar from './Sidebar.jsx';
import TopNavbar from './TopNavbar.jsx';
import { Outlet } from 'react-router-dom';

function MainLayout() {
  return (
    <div className="app-shell min-vh-100">
      <Sidebar />
      <div className="app-content-wrapper">
        <TopNavbar />
        <main className="app-content p-4 p-lg-5">
          <div className="app-page">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
