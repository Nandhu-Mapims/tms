import { useEffect, useState } from 'react';
import ManualClassificationFields from './ManualClassificationFields.jsx';

function TicketForm({
  formState,
  errors,
  departmentOptions = [],
  categoryOptions = [],
  subcategoryOptions = [],
  locationOptions = [],
  useAiClassification = false,
  onUseAiClassificationChange = () => {},
  onChange,
  onFileChange,
  onRemoveFile,
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
  const [previewError, setPreviewError] = useState('');
  const [imageThumbUrls, setImageThumbUrls] = useState([]);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    url: '',
    kind: 'image',
  });

  useEffect(() => {
    const attachments = Array.isArray(formState?.attachments) ? formState.attachments : [];
    const urls = attachments.map((file) => {
      const isImage = String(file?.type ?? '').startsWith('image/');
      return isImage ? URL.createObjectURL(file) : '';
    });
    setImageThumbUrls(urls);

    return () => {
      for (const url of urls) {
        if (url) URL.revokeObjectURL(url);
      }
    };
  }, [formState?.attachments]);

  const isImageFile = (file) => String(file?.type ?? '').startsWith('image/');
  const isPdfFile = (file) => String(file?.type ?? '') === 'application/pdf';

  const openPreviewModal = (file, kind) => {
    if (!file) return;
    setPreviewError('');
    try {
      const objectUrl = URL.createObjectURL(file);
      setModalState((prev) => {
        if (prev.url) URL.revokeObjectURL(prev.url);
        return {
          isOpen: true,
          title: file.name ?? 'Preview',
          url: objectUrl,
          kind,
        };
      });
    } catch {
      setPreviewError('Unable to preview this file. You can still submit it.');
    }
  };

  const closePreviewModal = () => {
    setModalState((prev) => {
      if (prev.url) URL.revokeObjectURL(prev.url);
      return { isOpen: false, title: '', url: '', kind: 'image' };
    });
  };

  const issuePlaceholder = useAiClassification
    ? 'Describe the issue clearly. AI will suggest category, subcategory, priority, and location from your text.'
    : 'Describe the issue in detail: symptoms, impact, urgency, and any error messages.';
  const issueHelp = useAiClassification
    ? 'Include as much context as you can; AI classification works best with specific details.'
    : 'Use the fields above for routing; this text becomes the ticket description.';

  return (
    <form onSubmit={onSubmit} className="card border-0 shadow-sm" noValidate>
      <div className="card-body p-4 p-lg-5">
        <div className="row g-4">
          <div className="col-12">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="useAiClassification"
                checked={useAiClassification}
                onChange={(event) => onUseAiClassificationChange(event.target.checked)}
                disabled={isSubmitting}
              />
              <label className="form-check-label fw-semibold" htmlFor="useAiClassification">
                Use AI to classify this ticket
              </label>
            </div>
            <div className="form-text ms-1">
              {useAiClassification
                ? 'AI suggests category, priority, and related fields from your description. Turn off to choose everything yourself.'
                : 'Standard mode: select category, subcategory, and priority below. Turn on to let AI infer them from your description.'}
            </div>
          </div>
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold">Send To Department</label>
            <select
              name="departmentId"
              className={`form-select ${errors.departmentId ? 'is-invalid' : ''}`}
              value={formState.departmentId ?? ''}
              onChange={handleInputChange}
            >
              <option value="">Select department</option>
              {departmentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {errors.departmentId ? (
              <div className="invalid-feedback">{errors.departmentId}</div>
            ) : (
              <div className="form-text">Choose which department should receive this ticket.</div>
            )}
          </div>
          {!useAiClassification ? (
            <ManualClassificationFields
              formState={formState}
              errors={errors}
              categoryOptions={categoryOptions}
              subcategoryOptions={subcategoryOptions}
              locationOptions={locationOptions}
              onChange={onChange}
              disabled={isSubmitting}
            />
          ) : null}
          <div className="col-12">
            <label className="form-label fw-semibold">Tell us your issue</label>
            <textarea
              rows="6"
              name="prompt"
              className={`form-control ${errors.prompt ? 'is-invalid' : ''}`}
              value={formState.prompt}
              onChange={handleInputChange}
              placeholder={issuePlaceholder}
            />
            {errors.prompt ? <div className="invalid-feedback">{errors.prompt}</div> : <div className="form-text">{issueHelp}</div>}
          </div>
          <div className="col-12">
            <label className="form-label fw-semibold">Attachments (Optional)</label>
            <input
              type="file"
              accept={attachmentAccept}
              multiple
              className={`form-control ${errors.attachment ? 'is-invalid' : ''}`}
              onChange={(event) => {
                onFileChange(Array.from(event.target.files ?? []));
                event.target.value = '';
              }}
            />
            {errors.attachment ? <div className="invalid-feedback">{errors.attachment}</div> : <div className="form-text">Allowed: PDF, Word, text, JPG, PNG, WEBP up to 10MB.</div>}
            {previewError ? <div className="text-danger small mt-1">{previewError}</div> : null}
            {Array.isArray(formState.attachments) && formState.attachments.length ? (
              <div className="mt-3 border rounded-3 p-3 bg-light-subtle">
                <div className="small fw-semibold mb-2">Selected files ({formState.attachments.length})</div>
                <div className="d-grid gap-2">
                  {formState.attachments.map((file, index) => {
                    const thumbUrl = imageThumbUrls[index] ?? '';
                    return (
                      <div key={`${file.name}-${file.size}-${index}`} className="d-flex align-items-center justify-content-between gap-2">
                        <div className="d-flex align-items-center gap-2 min-w-0">
                          {isImageFile(file) && thumbUrl ? (
                            <img
                              src={thumbUrl}
                              alt={file.name}
                              style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6 }}
                            />
                          ) : (
                            <i className="bi bi-paperclip text-secondary"></i>
                          )}
                          <div className="small text-truncate" title={file.name ?? ''}>
                            {file.name ?? 'Unnamed file'}
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              if (isImageFile(file)) openPreviewModal(file, 'image');
                              else if (isPdfFile(file)) openPreviewModal(file, 'pdf');
                              else openPreviewModal(file, 'generic');
                            }}
                          >
                            Preview
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onRemoveFile(index)}>
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {modalState.isOpen ? (
          <div
            role="dialog"
            aria-modal="true"
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ background: 'rgba(0,0,0,0.55)', zIndex: 1050 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closePreviewModal();
            }}
          >
            <div
              className="bg-white rounded-3 shadow-sm position-absolute"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 'min(900px, 95vw)',
                maxHeight: '85vh',
                overflow: 'auto',
              }}
            >
              <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
                <div className="fw-semibold small text-truncate" style={{ maxWidth: '75%' }} title={modalState.title}>
                  {modalState.title}
                </div>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={closePreviewModal}>
                  Close
                </button>
              </div>
              <div className="p-3">
                {modalState.kind === 'image' ? (
                  <img
                    src={modalState.url}
                    alt={modalState.title}
                    style={{ width: '100%', height: 'auto', maxHeight: '72vh', objectFit: 'contain' }}
                  />
                ) : modalState.kind === 'pdf' ? (
                  <iframe
                    title={modalState.title}
                    src={modalState.url}
                    style={{ width: '100%', height: '72vh', border: 'none' }}
                  />
                ) : (
                  <div className="text-center text-secondary">
                    Preview is only available for images and PDFs.
                    <div className="small mt-2">You can still submit this attachment.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

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
