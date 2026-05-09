/**
 * When FEEDBACK_INGEST_TOKEN is set, incoming requests must send the same value in
 * header X-Feedback-Ingest-Token. When unset/empty, ingest is open (see ops docs).
 */
const feedbackIngestAuth = (req, res, next) => {
  const token = process.env.FEEDBACK_INGEST_TOKEN;
  if (token == null || String(token).trim() === '') {
    return next();
  }
  const provided = String(req.headers['x-feedback-ingest-token'] || '').trim();
  if (provided !== String(token).trim()) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or missing X-Feedback-Ingest-Token',
    });
  }
  return next();
};

module.exports = { feedbackIngestAuth };
