export const isBlank = (value) => String(value ?? '').trim() === '';

export const validateRequired = (value, label) => {
  if (isBlank(value)) {
    return `${label} is required.`;
  }

  return '';
};

export const validateEmail = (value) => {
  if (isBlank(value)) {
    return 'Email address is required.';
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(String(value).trim()) ? '' : 'Enter a valid email address.';
};

export const validateMinLength = (value, minLength, label) => {
  if (String(value ?? '').length < minLength) {
    return `${label} must be at least ${minLength} characters.`;
  }

  return '';
};

export const validatePositiveInteger = (value, label, { required = false } = {}) => {
  if (value === '' || value === null || value === undefined) {
    return required ? `${label} is required.` : '';
  }

  return Number.isInteger(Number(value)) && Number(value) > 0 ? '' : `${label} must be a valid positive number.`;
};

export const validateFile = (file, { allowedTypes = [], maxSizeInBytes = 10 * 1024 * 1024 } = {}) => {
  if (!file) {
    return '';
  }

  if (allowedTypes.length && !allowedTypes.includes(file.type)) {
    return 'Unsupported file type selected.';
  }

  if (file.size > maxSizeInBytes) {
    return 'Selected file exceeds the allowed size limit.';
  }

  return '';
};
