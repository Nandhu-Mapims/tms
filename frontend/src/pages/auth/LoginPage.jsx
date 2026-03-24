import { useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { APP_NAME } from '../../config/appConfig';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { validateFiveDigitEmpId, validateMinLength } from '../../utils/validators';

function LoginPage() {
  const toast = useToast();
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();
  const redirectPath = useMemo(() => location.state?.from?.pathname || '/dashboard', [location.state]);

  const [formState, setFormState] = useState({
    empId: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {
      empId: validateRequired(formState.empId, 'Employee ID'),
      password: validateMinLength(formState.password, 8, 'Password'),
    };

    Object.keys(nextErrors).forEach((key) => {
      if (!nextErrors[key]) {
        delete nextErrors[key];
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        empId: formState.empId.trim(),
        password: formState.password,
      });
      toast.success('Signed in successfully.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to sign in. Please verify your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page min-vh-100 d-flex align-items-center justify-content-center px-3 py-5">
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-lg-10 col-xl-9">
          <div className="card login-card border-0 shadow-lg overflow-hidden">
            <div className="row g-0">
              <div className="col-lg-6 login-brand-panel p-5 text-white d-flex flex-column justify-content-between">
                <div>
                  <div className="d-inline-flex align-items-center gap-2 badge rounded-pill text-bg-light text-primary mb-4 px-3 py-2">
                    <img src="/hospital-mark.svg" alt="Hospital mark" width="20" height="20" />
                    <span>{APP_NAME}</span>
                  </div>
                  <h1 className="display-6 fw-bold mb-3">Secure access for hospital service operations.</h1>
                  <p className="lead opacity-75 mb-0">
                    Centralize incident intake, engineering support, helpdesk coordination, and operational visibility.
                  </p>
                </div>
                <div className="small opacity-75">
                  Designed for administrators, helpdesk teams, technicians, department heads, and requesters.
                </div>
              </div>

              <div className="col-lg-6 bg-white p-4 p-md-5">
                <div className="mb-4">
                  <h2 className="h3 fw-bold text-dark mb-2">Sign In</h2>
                  <p className="text-secondary mb-0">Use your employee ID to access the service management console.</p>
                </div>

                <form onSubmit={handleSubmit} className="d-grid gap-3" noValidate>
                  <div>
                    <label htmlFor="empId" className="form-label fw-semibold">Employee ID</label>
                    <input
                      id="empId"
                      name="empId"
                      type="text"
                      inputMode="numeric"
                      autoComplete="username"
                      maxLength={5}
                      pattern="[0-9]{5}"
                      className={`form-control form-control-lg ${errors.empId ? 'is-invalid' : ''}`}
                      placeholder="e.g. 10001"
                      value={formState.empId}
                      onChange={handleChange}
                    />
                    {errors.empId ? <div className="invalid-feedback">{errors.empId}</div> : null}
                  </div>

                  <div>
                    <label htmlFor="password" className="form-label fw-semibold">Password</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`}
                      placeholder="Enter your password"
                      value={formState.password}
                      onChange={handleChange}
                    />
                    {errors.password ? <div className="invalid-feedback">{errors.password}</div> : null}
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg mt-2" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span className="d-inline-flex align-items-center gap-2">
                        <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                        <span>Signing In...</span>
                      </span>
                    ) : 'Sign In'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
