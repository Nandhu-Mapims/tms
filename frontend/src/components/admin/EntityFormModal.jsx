import { useEffect, useMemo, useState } from 'react';
import { validateEmail, validateMinLength, validatePositiveInteger, validateRequired } from '../../utils/validators';

const runFieldValidation = (field, value) => {
  if (field.required) {
    const requiredError = validateRequired(value, field.label);
    if (requiredError) {
      return requiredError;
    }
  }

  if (field.type === 'email' && value) {
    const emailError = validateEmail(value);
    if (emailError) {
      return emailError;
    }
  }

  if (field.type === 'password' && field.minLength && value) {
    const minLengthError = validateMinLength(value, field.minLength, field.label);
    if (minLengthError) {
      return minLengthError;
    }
  }

  if (field.type === 'number') {
    const numberError = validatePositiveInteger(value, field.label, { required: field.required });
    if (numberError) {
      return numberError;
    }
  }

  if (typeof field.validate === 'function') {
    return field.validate(value) || '';
  }

  return '';
};

function EntityFormModal({ show, title, fields, initialValues, onClose, onSubmit, isSubmitting }) {
  const defaultState = useMemo(() => {
    const state = {};
    fields.forEach((field) => {
      state[field.name] = initialValues?.[field.name] ?? (field.type === 'checkbox' ? false : '');
    });
    return state;
  }, [fields, initialValues]);

  const [formState, setFormState] = useState(defaultState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormState(defaultState);
    setErrors({});
  }, [defaultState]);

  if (!show) {
    return null;
  }

  const handleChange = (field, event) => {
    const value = field.type === 'checkbox' ? event.target.checked : event.target.value;
    setFormState((prev) => ({ ...prev, [field.name]: value }));
    setErrors((prev) => ({ ...prev, [field.name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    fields.forEach((field) => {
      const error = runFieldValidation(field, formState[field.name]);
      if (error) {
        nextErrors[field.name] = error;
      }
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      return;
    }

    await onSubmit(formState);
  };

  return (
    <div className="modal fade show d-block modal-backdrop-soft" tabIndex="-1" role="dialog" aria-modal="true">
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content border-0 shadow">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h2 className="modal-title fs-5">{title}</h2>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                {fields.map((field) => (
                  <div key={field.name} className={field.colClass || 'col-12'}>
                    {field.type === 'checkbox' ? (
                      <div className="form-check mt-4">
                        <input
                          id={field.name}
                          type="checkbox"
                          className="form-check-input"
                          checked={Boolean(formState[field.name])}
                          onChange={(event) => handleChange(field, event)}
                        />
                        <label htmlFor={field.name} className="form-check-label">
                          {field.label}
                        </label>
                      </div>
                    ) : (
                      <>
                        <label htmlFor={field.name} className="form-label">{field.label}</label>
                        {field.type === 'select' ? (
                          <select
                            id={field.name}
                            className={`form-select ${errors[field.name] ? 'is-invalid' : ''}`}
                            value={formState[field.name]}
                            onChange={(event) => handleChange(field, event)}
                            required={field.required}
                          >
                            <option value="">{field.placeholder || `Select ${field.label}`}</option>
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            id={field.name}
                            className={`form-control ${errors[field.name] ? 'is-invalid' : ''}`}
                            rows={field.rows || 3}
                            value={formState[field.name]}
                            onChange={(event) => handleChange(field, event)}
                            required={field.required}
                          />
                        ) : (
                          <input
                            id={field.name}
                            type={field.type || 'text'}
                            className={`form-control ${errors[field.name] ? 'is-invalid' : ''}`}
                            value={formState[field.name]}
                            onChange={(event) => handleChange(field, event)}
                            required={field.required}
                            min={field.min}
                          />
                        )}
                        {errors[field.name] ? <div className="invalid-feedback">{errors[field.name]}</div> : null}
                        {field.helpText ? <div className="form-text">{field.helpText}</div> : null}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EntityFormModal;
