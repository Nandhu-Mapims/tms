const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
];

function ManualClassificationFields({
  formState,
  errors,
  categoryOptions = [],
  subcategoryOptions = [],
  onChange,
  disabled = false,
}) {
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  return (
    <>
      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Category</label>
        <select
          name="categoryId"
          className={`form-select ${errors.categoryId ? 'is-invalid' : ''}`}
          value={formState.categoryId ?? ''}
          onChange={handleInputChange}
          disabled={disabled}
        >
          <option value="">Select category</option>
          {categoryOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {errors.categoryId ? <div className="invalid-feedback">{errors.categoryId}</div> : null}
      </div>
      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Subcategory</label>
        <select
          name="subcategoryId"
          className={`form-select ${errors.subcategoryId ? 'is-invalid' : ''}`}
          value={formState.subcategoryId ?? ''}
          onChange={handleInputChange}
          disabled={disabled || !formState.categoryId}
        >
          <option value="">{formState.categoryId ? 'Select subcategory' : 'Select a category first'}</option>
          {subcategoryOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {errors.subcategoryId ? <div className="invalid-feedback">{errors.subcategoryId}</div> : null}
      </div>
      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Priority</label>
        <select
          name="priority"
          className={`form-select ${errors.priority ? 'is-invalid' : ''}`}
          value={formState.priority ?? ''}
          onChange={handleInputChange}
          disabled={disabled}
        >
          <option value="">Select priority</option>
          {PRIORITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {errors.priority ? <div className="invalid-feedback">{errors.priority}</div> : null}
      </div>
      <div className="col-12 col-md-6">
        <label className="form-label fw-semibold">Location (optional)</label>
        <input
          type="text"
          name="locationText"
          className={`form-control ${errors.locationText ? 'is-invalid' : ''}`}
          value={formState.locationText ?? ''}
          onChange={handleInputChange}
          placeholder="e.g. Ward B, Room 12, 2nd Floor"
          disabled={disabled}
        />
        {errors.locationText ? <div className="invalid-feedback">{errors.locationText}</div> : (
          <div className="form-text">Type the ward, room, floor, or block where the issue is.</div>
        )}
      </div>
    </>
  );
}

export default ManualClassificationFields;
