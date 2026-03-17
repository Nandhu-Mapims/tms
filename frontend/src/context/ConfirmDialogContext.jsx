import { createContext, useMemo, useRef, useState } from 'react';
import ConfirmDialog from '../components/common/ConfirmDialog.jsx';

export const ConfirmDialogContext = createContext(null);

const defaultDialog = {
  open: false,
  title: 'Confirm Action',
  message: 'Please confirm you want to continue.',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger',
};

export function ConfirmDialogProvider({ children }) {
  const resolverRef = useRef(null);
  const [dialogState, setDialogState] = useState(defaultDialog);

  const closeDialog = (result) => {
    setDialogState(defaultDialog);
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
  };

  const confirm = (config = {}) => new Promise((resolve) => {
    resolverRef.current = resolve;
    setDialogState({
      ...defaultDialog,
      ...config,
      open: true,
    });
  });

  const value = useMemo(() => ({ confirm }), []);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={dialogState.open}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        onConfirm={() => closeDialog(true)}
        onCancel={() => closeDialog(false)}
      />
    </ConfirmDialogContext.Provider>
  );
}
