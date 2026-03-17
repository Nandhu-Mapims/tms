import { createContext, useCallback, useMemo, useState } from 'react';
import ToastViewport from '../components/common/ToastViewport.jsx';

export const ToastContext = createContext(null);

const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((payload) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const nextToast = {
      id,
      title: payload.title || 'Notice',
      message: payload.message || '',
      variant: payload.variant || 'primary',
      duration: payload.duration || DEFAULT_DURATION,
    };

    setToasts((prev) => [...prev, nextToast]);
    window.setTimeout(() => removeToast(id), nextToast.duration);
    return id;
  }, [removeToast]);

  const value = useMemo(() => ({
    addToast,
    success: (message, options = {}) => addToast({ title: options.title || 'Success', message, variant: 'success', duration: options.duration }),
    error: (message, options = {}) => addToast({ title: options.title || 'Error', message, variant: 'danger', duration: options.duration || 5000 }),
    info: (message, options = {}) => addToast({ title: options.title || 'Info', message, variant: 'primary', duration: options.duration }),
    warning: (message, options = {}) => addToast({ title: options.title || 'Attention', message, variant: 'warning', duration: options.duration }),
    removeToast,
  }), [addToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}
