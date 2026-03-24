import { useEffect, useMemo, useState } from 'react';
import { validateEmail, validateMinLength, validatePositiveInteger, validateRequired } from '../../utils/validators';

const DURATION_UNIT = {
  MINUTES: 'MINUTES',
  HOURS: 'HOURS',
  DAYS: 'DAYS',
};

const DURATION_UNITS = [DURATION_UNIT.MINUTES, DURATION_UNIT.HOURS, DURATION_UNIT.DAYS];

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

const getDurationUnitFieldName = (name) => `${name}__unit`;

const deriveBestUnit = (minutes) => {
  const totalMinutes = Number(minutes);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return DURATION_UNIT.MINUTES;
  if (totalMinutes % MINUTES_PER_DAY === 0) return DURATION_UNIT.DAYS;
  if (totalMinutes % MINUTES_PER_HOUR === 0) return DURATION_UNIT.HOURS;
  return DURATION_UNIT.MINUTES;
};

const toMinutes = (value, unit) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return '';
  if (unit === DURATION_UNIT.DAYS) return String(Math.round(numericValue * MINUTES_PER_DAY));
  if (unit === DURATION_UNIT.HOURS) return String(Math.round(numericValue * MINUTES_PER_HOUR));
  return String(Math.round(numericValue));
};

const fromMinutes = (minutes, unit) => {
  const totalMinutes = Number(minutes);
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '';
  if (unit === DURATION_UNIT.DAYS) return String(totalMinutes / MINUTES_PER_DAY);
  if (unit === DURATION_UNIT.HOURS) return String(totalMinutes / MINUTES_PER_HOUR);
  return String(totalMinutes);
};

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

  if (field.type === 'number' || field.type === 'duration') {
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
      if (field.type === 'duration') {
        const unitField = getDurationUnitFieldName(field.name);
        const derivedUnit = deriveBestUnit(state[field.name]);
        state[unitField] = field.defaultUnit && DURATION_UNITS.includes(field.defaultUnit) ? field.defaultUnit : derivedUnit;
      }
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

  const handleDurationValueChange = (field, event) => {
    const rawValue = event.target.value;
    setFormState((prev) => {
      const unit = prev[getDurationUnitFieldName(field.name)] ?? DURATION_UNIT.MINUTES;
      return { ...prev, [field.name]: toMinutes(rawValue, unit) };
    });
    setErrors((prev) => ({ ...prev, [field.name]: '' }));
  };

  const handleDurationUnitChange = (field, event) => {
    const nextUnit = event.target.value;
    setFormState((prev) => {
      const unitField = getDurationUnitFieldName(field.name);
      const nextState = { ...prev, [unitField]: nextUnit };
      nextState[field.name] = toMinutes(fromMinutes(prev[field.name], prev[unitField] ?? DURATION_UNIT.MINUTES), nextUnit);
      return nextState;
    });
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
                        <label htmlFor={field.name} className="form-label">
                          {field.label}
                          {field.required ? <span className="text-danger ms-1">*</span> : null}
                        </label>
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
                          field.type === 'duration' ? (
                            <div className="input-group">
                              <input
                                id={field.name}
                                type="number"
                                className={`form-control ${errors[field.name] ? 'is-invalid' : ''}`}
                                value={fromMinutes(formState[field.name], formState[getDurationUnitFieldName(field.name)] ?? DURATION_UNIT.MINUTES)}
                                onChange={(event) => handleDurationValueChange(field, event)}
                                required={field.required}
                                min={field.min}
                                step="any"
                              />
                              <select
                                className="form-select"
                                style={{ maxWidth: 150 }}
                                value={formState[getDurationUnitFieldName(field.name)] ?? DURATION_UNIT.MINUTES}
                                onChange={(event) => handleDurationUnitChange(field, event)}
                              >
                                <option value={DURATION_UNIT.MINUTES}>Minutes</option>
                                <option value={DURATION_UNIT.HOURS}>Hours</option>
                                <option value={DURATION_UNIT.DAYS}>Days</option>
                              </select>
                            </div>
                          ) : (
                          <input
                            id={field.name}
                            type={field.type || 'text'}
                            className={`form-control ${errors[field.name] ? 'is-invalid' : ''}`}
                            value={formState[field.name]}
                            onChange={(event) => handleChange(field, event)}
                            required={field.required}
                            min={field.min}
                            maxLength={field.maxLength}
                            inputMode={field.inputMode}
                            pattern={field.pattern}
                            autoComplete={field.autoComplete}
                          />
                          )
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
