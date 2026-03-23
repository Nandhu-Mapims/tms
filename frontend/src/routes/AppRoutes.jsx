import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage.jsx';
import DashboardPage from '../pages/dashboard/DashboardPage.jsx';
import UnauthorizedPage from '../pages/errors/UnauthorizedPage.jsx';
import NotFoundPage from '../pages/errors/NotFoundPage.jsx';
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx';
import MainLayout from '../components/layout/MainLayout.jsx';
import CategoriesPage from '../pages/admin/CategoriesPage.jsx';
import DepartmentsPage from '../pages/admin/DepartmentsPage.jsx';
import LocationsPage from '../pages/admin/LocationsPage.jsx';
import SlaSettingsPage from '../pages/admin/SlaSettingsPage.jsx';
import SubcategoriesPage from '../pages/admin/SubcategoriesPage.jsx';
import UserManagementPage from '../pages/admin/UserManagementPage.jsx';
import TicketCreatePage from '../pages/tickets/TicketCreatePage.jsx';
import TicketDetailsPage from '../pages/tickets/TicketDetailsPage.jsx';
import TicketListPage from '../pages/tickets/TicketListPage.jsx';
import TransferRequestsPage from '../pages/tickets/TransferRequestsPage.jsx';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HELPDESK', 'HOD', 'REQUESTER']} />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketListPage />} />
          <Route element={<ProtectedRoute allowedRoles={['REQUESTER', 'HOD']} />}>
            <Route path="/tickets/create" element={<TicketCreatePage />} />
          </Route>
          <Route path="/tickets/:id" element={<TicketDetailsPage />} />
          <Route element={<ProtectedRoute allowedRoles={['HELPDESK']} />}>
            <Route path="/transfer-requests" element={<TransferRequestsPage />} />
          </Route>
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HELPDESK', 'HOD']} />}>
        <Route element={<MainLayout />}>
          <Route path="/admin/departments" element={<DepartmentsPage />} />
          <Route path="/admin/categories" element={<CategoriesPage />} />
          <Route path="/admin/subcategories" element={<SubcategoriesPage />} />
          <Route path="/admin/locations" element={<LocationsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<MainLayout />}>
          <Route path="/admin/sla-settings" element={<SlaSettingsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route element={<MainLayout />}>
          <Route path="/admin/users" element={<UserManagementPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default AppRoutes;
