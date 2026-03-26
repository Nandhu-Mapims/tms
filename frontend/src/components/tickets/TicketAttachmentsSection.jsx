import { useState } from 'react';
import { API_PUBLIC_BASE_URL } from '../../config/appConfig';
import { formatDateTime } from '../../utils/ticketHelpers';
import { validateFile } from '../../utils/validators';

const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const FILE_ACCEPT = [
  '.pdf',
  '.doc',
  '.docx',
  '.txt',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
].join(',');

function TicketAttachmentsSection({ attachments, onUpload, isUploading, canUpload = true }) {
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState(null);

  const buildPublicUrl = (filePath) => `${API_PUBLIC_BASE_URL}/${String(filePath ?? '').replace(/^\/+/, '')}`;

  const canInlinePreview = (attachment) => {
    const mime = String(attachment?.mimeType ?? '');
    return mime.startsWith('image/') || mime === 'application/pdf' || mime === 'text/plain';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateFile(file, { allowedTypes: ALLOWED_TYPES });

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!file) {
      setErrorMessage('Select a file to upload.');
      return;
    }

    setErrorMessage('');
    await onUpload(file);
    setFile(null);
    event.target.reset();
  };

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0">Attachments</h2>
          <span className="badge text-bg-light">{attachments.length}</span>
        </div>

        {canUpload ? (
          <form onSubmit={handleSubmit} className="row g-3 align-items-end mb-4" noValidate>
            <div className="col-12 col-md-8">
              <label className="form-label">Upload attachment or image (optional)</label>
              <input
                type="file"
                accept={FILE_ACCEPT}
                className={`form-control ${errorMessage ? 'is-invalid' : ''}`}
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null;
                  setFile(nextFile);
                  setErrorMessage(validateFile(nextFile, { allowedTypes: ALLOWED_TYPES }));
                }}
              />
              {errorMessage ? <div className="invalid-feedback">{errorMessage}</div> : null}
              <div className="form-text">Optional. Allowed: PDF, Word, text, JPG, PNG, WEBP up to 10MB.</div>
            </div>
            <div className="col-12 col-md-4">
              <button type="submit" className="btn btn-outline-primary w-100" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        ) : (
          <div className="border rounded-4 p-3 mb-4 text-secondary small">
            File uploads are available only to the <strong>assigned helpdesk agent</strong> (and leadership roles).
          </div>
        )}

        <div className="list-group list-group-flush">
          {attachments.length ? attachments.map((attachment) => (
            <div key={attachment.id} className="list-group-item px-0 py-3">
              <div className="d-flex justify-content-between align-items-start gap-3">
                <div>
                  <div className="fw-semibold">{attachment.originalName}</div>
                  <div className="small text-secondary">
                    Uploaded by {attachment.uploadedBy?.fullName || 'User'} | {formatDateTime(attachment.createdAt)}
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-2 justify-content-end">
                  {canInlinePreview(attachment) ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setPreviewAttachment(attachment)}
                    >
                      Preview
                    </button>
                  ) : null}
                  <a
                    href={buildPublicUrl(attachment.filePath)}
                    className="btn btn-sm btn-outline-secondary"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open
                  </a>
                </div>
              </div>
            </div>
          )) : <div className="border rounded-4 p-3 text-secondary small">No attachments uploaded yet.</div>}
        </div>
      </div>

      {previewAttachment ? (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 p-lg-5"
          style={{ background: 'rgba(18, 30, 42, 0.55)', zIndex: 1090 }}
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="bg-white rounded-4 shadow-lg w-100"
            style={{ maxWidth: 980, maxHeight: '92vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between gap-3 p-3 border-bottom">
              <div className="fw-semibold text-truncate">{previewAttachment.originalName}</div>
              <div className="d-flex align-items-center gap-2">
                <a
                  className="btn btn-sm btn-outline-secondary"
                  href={buildPublicUrl(previewAttachment.filePath)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open in new tab
                </a>
                <button type="button" className="btn btn-sm btn-primary" onClick={() => setPreviewAttachment(null)}>
                  Close
                </button>
              </div>
            </div>
            <div className="p-3" style={{ overflow: 'auto', maxHeight: 'calc(92vh - 64px)' }}>
              {String(previewAttachment?.mimeType ?? '').startsWith('image/') ? (
                <img
                  alt={previewAttachment.originalName ?? 'Attachment preview'}
                  src={buildPublicUrl(previewAttachment.filePath)}
                  className="img-fluid rounded-4 border"
                  loading="lazy"
                />
              ) : String(previewAttachment?.mimeType ?? '') === 'application/pdf' ? (
                <iframe
                  title={previewAttachment.originalName ?? 'PDF preview'}
                  src={buildPublicUrl(previewAttachment.filePath)}
                  style={{ width: '100%', height: '70vh' }}
                />
              ) : String(previewAttachment?.mimeType ?? '') === 'text/plain' ? (
                <iframe
                  title={previewAttachment.originalName ?? 'Text preview'}
                  src={buildPublicUrl(previewAttachment.filePath)}
                  style={{ width: '100%', height: '70vh' }}
                />
              ) : (
                <div className="text-secondary small">
                  Preview is not available for this file type. Use “Open in new tab”.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default TicketAttachmentsSection;
