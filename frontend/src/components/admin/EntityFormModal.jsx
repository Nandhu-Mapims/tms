import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
const getSelectionModeFieldName = (name) => `${name}__selectionMode`;

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
      if (field.type === 'multiselect') {
        state[field.name] = Array.isArray(initialValues?.[field.name]) ? initialValues[field.name] : [];
        const modeField = getSelectionModeFieldName(field.name);
        state[modeField] = state[field.name].length > 1 ? 'multiple' : (field.defaultSelectionMode || 'single');
      } else {
        state[field.name] = initialValues?.[field.name] ?? (field.type === 'checkbox' ? false : '');
      }
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
  const [openMultiField, setOpenMultiField] = useState('');
  const multiRef = useRef(null);

  useEffect(() => {
    setFormState(defaultState);
    setErrors({});
    setOpenMultiField('');
  }, [defaultState]);

  const handleClickOutside = useCallback((e) => {
    if (multiRef.current && !multiRef.current.contains(e.target)) {
      setOpenMultiField('');
    }
  }, []);

  useEffect(() => {
    if (openMultiField) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [openMultiField, handleClickOutside]);

  if (!show) {
    return null;
  }

  const handleChange = (field, event) => {
    const value = field.type === 'checkbox'
      ? event.target.checked
      : field.type === 'multiselect'
        ? Array.from(event.target.selectedOptions).map((opt) => opt.value)
        : event.target.value;
    setFormState((prev) => ({ ...prev, [field.name]: value }));
    setErrors((prev) => ({ ...prev, [field.name]: '' }));
  };

  const handleSelectionModeChange = (field, nextMode) => {
    const modeField = getSelectionModeFieldName(field.name);
    setFormState((prev) => {
      const current = Array.isArray(prev[field.name]) ? prev[field.name] : [];
      const normalized = nextMode === 'single' ? current.slice(0, 1) : current;
      return { ...prev, [modeField]: nextMode, [field.name]: normalized };
    });
    setErrors((prev) => ({ ...prev, [field.name]: '' }));
  };

  const handleMultiCheckboxChange = (field, optionValue, checked) => {
    const modeField = getSelectionModeFieldName(field.name);
    setFormState((prev) => {
      const mode = prev[modeField] || 'single';
      const current = Array.isArray(prev[field.name]) ? prev[field.name] : [];
      let next = current;
      if (mode === 'single') {
        next = checked ? [optionValue] : [];
        if (checked) {
          setOpenMultiField('');
        }
      } else if (checked) {
        next = current.includes(optionValue) ? current : [...current, optionValue];
      } else {
        next = current.filter((item) => item !== optionValue);
      }
      return { ...prev, [field.name]: next };
    });
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
                        ) : field.type === 'multiselect' ? (
                          (() => {
                            const selectedValues = Array.isArray(formState[field.name]) ? formState[field.name] : [];
                            const optionsMap = Object.fromEntries((field.options ?? []).map((o) => [o.value, o.label]));
                            const mode = formState[getSelectionModeFieldName(field.name)] || 'single';
                            const isOpen = openMultiField === field.name;
                            const hasError = errors[field.name];

                            return (
                              <div>
                                <style>{`.efm-opt:hover{background:rgba(var(--bs-primary-rgb),.06)!important}`}</style>

                                <div className="d-inline-flex rounded-pill border overflow-hidden mb-2" style={{ fontSize: '0.8rem' }}>
                                  <button
                                    type="button"
                                    className={`btn btn-sm border-0 rounded-0 px-3 py-1 ${mode === 'single' ? 'bg-primary text-white' : 'bg-white text-dark'}`}
                                    onClick={() => handleSelectionModeChange(field, 'single')}
                                  >
                                    Single
                                  </button>
                                  <button
                                    type="button"
                                    className={`btn btn-sm border-0 rounded-0 px-3 py-1 ${mode === 'multiple' ? 'bg-primary text-white' : 'bg-white text-dark'}`}
                                    onClick={() => handleSelectionModeChange(field, 'multiple')}
                                  >
                                    Multiple
                                  </button>
                                </div>

                                <div className="position-relative" ref={isOpen ? multiRef : undefined}>
                                  <div
                                    className={`form-control d-flex flex-wrap align-items-center gap-1 ${hasError ? 'is-invalid' : ''}`}
                                    style={{ minHeight: 42, cursor: 'pointer' }}
                                    onClick={() => setOpenMultiField((prev) => (prev === field.name ? '' : field.name))}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenMultiField((prev) => (prev === field.name ? '' : field.name)); } }}
                                  >
                                    {selectedValues.length ? (
                                      selectedValues.map((val) => (
                                        <span
                                          key={val}
                                          className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 d-inline-flex align-items-center gap-1 px-2 py-1"
                                        >
                                          {optionsMap[val] ?? val}
                                          <button
                                            type="button"
                                            className="btn-close btn-close-sm ms-1"
                                            style={{ fontSize: '0.55rem' }}
                                            aria-label="Remove"
                                            onClick={(e) => { e.stopPropagation(); handleMultiCheckboxChange(field, val, false); }}
                                          />
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-secondary">Click to select department(s)</span>
                                    )}
                                    <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'} ms-auto text-secondary`} aria-hidden="true" />
                                  </div>

                                  {isOpen ? (
                                    <div
                                      className="border rounded-3 shadow-sm bg-white position-absolute w-100 mt-1 py-2"
                                      style={{ zIndex: 10, maxHeight: 240, overflowY: 'auto' }}
                                    >
                                      {field.options?.map((option) => {
                                        const checked = selectedValues.includes(option.value);
                                        return (
                                          <div
                                            key={option.value}
                                            className={`efm-opt d-flex align-items-center gap-2 px-3 py-2 ${checked ? 'bg-primary bg-opacity-10' : ''}`}
                                            style={{ cursor: 'pointer', transition: 'background .15s' }}
                                            onClick={() => handleMultiCheckboxChange(field, option.value, !checked)}
                                            role="option"
                                            aria-selected={checked}
                                          >
                                            <div
                                              className={`d-flex align-items-center justify-content-center rounded-2 border flex-shrink-0 ${checked ? 'bg-primary border-primary text-white' : 'border-secondary-subtle'}`}
                                              style={{ width: 20, height: 20, fontSize: 12 }}
                                            >
                                              {checked ? <i className="bi bi-check-lg" /> : null}
                                            </div>
                                            <span className={`small ${checked ? 'fw-semibold text-primary' : 'text-dark'}`}>{option.label}</span>
                                          </div>
                                        );
                                      })}

                                      {mode === 'multiple' && selectedValues.length > 0 ? (
                                        <div className="text-end mt-1 pt-2 px-3 border-top">
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-primary"
                                            onClick={() => setOpenMultiField('')}
                                          >
                                            Done
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })()
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
