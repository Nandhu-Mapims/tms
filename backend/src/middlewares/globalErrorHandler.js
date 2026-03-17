const { MulterError } = require('multer');
const { PrismaClientKnownRequestError } = require('@prisma/client/runtime/library');
const { StatusCodes } = require('http-status-codes');

const globalErrorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Internal server error';

  if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
    statusCode = StatusCodes.CONFLICT;
    message = 'A record with this value already exists';
  }

  if (err instanceof MulterError) {
    statusCode = StatusCodes.BAD_REQUEST;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Attachment exceeds the 10MB upload limit' : err.message;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = globalErrorHandler;
