function TicketForm({
  formState,
  errors,
  onChange,
  onFileChange,
  onSubmit,
  isSubmitting,
}) {
  const attachmentAccept = [
    '.pdf',
    '.doc',
    '.docx',
    '.txt',
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
  ].join(',');

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    onChange(name, value);
  };

  return (
    <form onSubmit={onSubmit} className="card border-0 shadow-sm" noValidate>
      <div className="card-body p-4 p-lg-5">
        <div className="row g-4">
          <div className="col-12">
            <label className="form-label fw-semibold">Tell us your issue</label>
            <textarea
              rows="6"
              name="prompt"
              className={`form-control ${errors.prompt ? 'is-invalid' : ''}`}
              value={formState.prompt}
              onChange={handleInputChange}
              placeholder="Describe the issue clearly. AI will choose category, department, location, and priority for you."
            />
            {errors.prompt ? <div className="invalid-feedback">{errors.prompt}</div> : <div className="form-text">Include symptoms, impact, and urgency. AI auto-classifies the ticket.</div>}
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold">Attachment (Optional)</label>
            <input
              type="file"
              accept={attachmentAccept}
              className={`form-control ${errors.attachment ? 'is-invalid' : ''}`}
              onChange={(event) => onFileChange(event.target.files?.[0] || null)}
            />
            {errors.attachment ? <div className="invalid-feedback">{errors.attachment}</div> : <div className="form-text">Allowed: PDF, Word, text, JPG, PNG, WEBP up to 10MB.</div>}
          </div>
        </div>

        <div className="d-flex justify-content-end mt-4">
          <button type="submit" className="btn btn-primary px-4" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="d-inline-flex align-items-center gap-2">
                <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                <span>Submitting...</span>
              </span>
            ) : 'Create Ticket'}
          </button>
        </div>
      </div>
    </form>
  );
}

export default TicketForm;
