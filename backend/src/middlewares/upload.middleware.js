const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { StatusCodes } = require('http-status-codes');
const ApiError = require('../utils/ApiError');

const uploadDirectory = path.join(process.cwd(), 'uploads', 'tickets');

if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const generatedName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension}`;
    cb(null, generatedName);
  },
});

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new ApiError(StatusCodes.BAD_REQUEST, 'Unsupported file type for ticket attachment'));
  }

  cb(null, true);
};

const uploadTicketAttachment = multer({
  storage,
  limits: {
    fileSize: 150 * 1024 * 1024,
  },
  fileFilter,
}).single('attachment');

module.exports = {
  uploadTicketAttachment,
};
