import { createContext, useEffect, useMemo, useState } from 'react';
import { clearStoredAuth, loadStoredAuth, saveStoredAuth } from '../utils/authStorage';
import { getCurrentUserRequest, loginRequest } from '../services/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const storedAuth = loadStoredAuth();
  const [authState, setAuthState] = useState({
    user: storedAuth?.user || null,
    token: storedAuth?.token || null,
    isAuthenticated: Boolean(storedAuth?.token),
    isInitializing: Boolean(storedAuth?.token),
  });

  useEffect(() => {
    const hydrateAuth = async () => {
      if (!storedAuth?.token) {
        setAuthState((prev) => ({ ...prev, isInitializing: false }));
        return;
      }

      try {
        const response = await getCurrentUserRequest();
        const nextAuth = {
          token: storedAuth.token,
          user: response.data,
        };

        saveStoredAuth(nextAuth);
        setAuthState({
          token: nextAuth.token,
          user: nextAuth.user,
          isAuthenticated: true,
          isInitializing: false,
        });
      } catch (error) {
        clearStoredAuth();
        setAuthState({
          token: null,
          user: null,
          isAuthenticated: false,
          isInitializing: false,
        });
      }
    };

    hydrateAuth();
  }, []);

  useEffect(() => {
    const handleLogout = () => {
      clearStoredAuth();
      setAuthState({
        token: null,
        user: null,
        isAuthenticated: false,
        isInitializing: false,
      });
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async (credentials) => {
    const response = await loginRequest(credentials);
    const nextAuth = {
      token: response.data.token,
      user: response.data.user,
    };

    saveStoredAuth(nextAuth);
    setAuthState({
      token: nextAuth.token,
      user: nextAuth.user,
      isAuthenticated: true,
      isInitializing: false,
    });

    return nextAuth;
  };

  const logout = () => {
    clearStoredAuth();
    setAuthState({
      token: null,
      user: null,
      isAuthenticated: false,
      isInitializing: false,
    });
  };

  const value = useMemo(
    () => ({
      ...authState,
      login,
      logout,
    }),
    [authState]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
