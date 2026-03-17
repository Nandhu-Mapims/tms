const AUTH_STORAGE_KEY = 'tms_auth';

export const loadStoredAuth = () => {
  try {
    const rawValue = localStorage.getItem(AUTH_STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const saveStoredAuth = (value) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};
