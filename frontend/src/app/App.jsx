import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '../routes/AppRoutes.jsx';
import { AuthProvider } from '../context/AuthContext.jsx';
import { ToastProvider } from '../context/ToastContext.jsx';
import { ConfirmDialogProvider } from '../context/ConfirmDialogContext.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ConfirmDialogProvider>
            <AppRoutes />
          </ConfirmDialogProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
