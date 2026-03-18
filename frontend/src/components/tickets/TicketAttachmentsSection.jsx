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

function TicketAttachmentsSection({ attachments, onUpload, isUploading }) {
  const [file, setFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

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

        <form onSubmit={handleSubmit} className="row g-3 align-items-end mb-4" noValidate>
          <div className="col-12 col-md-8">
            <label className="form-label">Upload Attachment</label>
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
            <div className="form-text">Allowed: PDF, Word, text, JPG, PNG, WEBP up to 10MB.</div>
          </div>
          <div className="col-12 col-md-4">
            <button type="submit" className="btn btn-outline-primary w-100" disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>

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
                <a
                  href={`${API_PUBLIC_BASE_URL}/${attachment.filePath}`}
                  className="btn btn-sm btn-outline-secondary"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              </div>
            </div>
          )) : <div className="border rounded-4 p-3 text-secondary small">No attachments uploaded yet.</div>}
        </div>
      </div>
    </div>
  );
}

export default TicketAttachmentsSection;
