  
const { sendError } = require('../utils/response');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Database error handler
const handleSequelizeError = (error) => {
  let message = 'Database error';
  let statusCode = 500;

  switch (error.name) {
    case 'SequelizeValidationError':
      message = 'Validation error';
      statusCode = 400;
      if (error.errors && error.errors.length > 0) {
        message = error.errors.map(err => err.message).join(', ');
      }
      break;

    case 'SequelizeUniqueConstraintError':
      message = 'Data already exists';
      statusCode = 409;
      if (error.errors && error.errors.length > 0) {
        const field = error.errors[0].path;
        message = `${field} already exists`;
      }
      break;

    case 'SequelizeForeignKeyConstraintError':
      message = 'Referenced data not found';
      statusCode = 400;
      break;

    case 'SequelizeConnectionError':
    case 'SequelizeConnectionRefusedError':
    case 'SequelizeHostNotFoundError':
    case 'SequelizeHostNotReachableError':
    case 'SequelizeInvalidConnectionError':
    case 'SequelizeConnectionTimedOutError':
      message = 'Database connection failed';
      statusCode = 503;
      break;

    case 'SequelizeDatabaseError':
      message = 'Database query error';
      statusCode = 500;
      if (error.original && error.original.code) {
        switch (error.original.code) {
          case 'ER_NO_SUCH_TABLE':
            message = 'Table not found';
            break;
          case 'ER_BAD_FIELD_ERROR':
            message = 'Invalid field name';
            break;
          case 'ER_DUP_ENTRY':
            message = 'Duplicate entry';
            statusCode = 409;
            break;
        }
      }
      break;

    case 'SequelizeTimeoutError':
      message = 'Database query timeout';
      statusCode = 504;
      break;
  }

  return new AppError(message, statusCode);
};

// JWT error handler
const handleJWTError = (error) => {
  let message = 'Authentication failed';
  let statusCode = 401;

  switch (error.name) {
    case 'JsonWebTokenError':
      message = 'Invalid token';
      break;
    case 'TokenExpiredError':
      message = 'Token expired';
      break;
    case 'NotBeforeError':
      message = 'Token not active';
      break;
  }

  return new AppError(message, statusCode);
};

// Multer error handler (file upload)
const handleMulterError = (error) => {
  let message = 'File upload error';
  let statusCode = 400;

  switch (error.code) {
    case 'LIMIT_FILE_SIZE':
      message = 'File too large';
      break;
    case 'LIMIT_FILE_COUNT':
      message = 'Too many files';
      break;
    case 'LIMIT_UNEXPECTED_FILE':
      message = 'Unexpected file field';
      break;
    case 'LIMIT_PART_COUNT':
      message = 'Too many parts';
      break;
  }

  return new AppError(message, statusCode);
};

// Development error response
const sendErrorDev = (err, res) => {
  const response = {
    success: false,
    message: err.message || 'Internal server error',
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode
    },
    timestamp: new Date().toISOString()
  };

  if (err.errors) {
    response.errors = err.errors;
  }

  res.status(err.statusCode || 500).json(response);
};

// Production error response
const sendErrorProd = (err, res) => {
  // Operational errors: send message to client
  if (err.isOperational) {
    const response = {
      success: false,
      message: err.message,
      timestamp: new Date().toISOString()
    };

    if (err.errors) {
      response.errors = err.errors;
    }

    return res.status(err.statusCode).json(response);
  }

  // Programming errors: don't leak error details
  console.error('ERROR:', err);

  return res.status(500).json({
    success: false,
    message: 'Something went wrong',
    timestamp: new Date().toISOString()
  });
};

// Log error untuk monitoring
const logError = (error, req) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : 'anonymous',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  };

  // Log ke console (di production bisa diganti dengan logging service)
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR:', JSON.stringify(logData, null, 2));
  } else {
    console.error('ERROR:', logData);
  }

  // TODO: Send to logging service (Sentry, LogRocket, etc.)
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log error
  logError(err, req);

  let error = { ...err };
  error.message = err.message;

  // Handle different types of errors
  if (err.name && err.name.startsWith('Sequelize')) {
    error = handleSequelizeError(err);
  } else if (err.name && err.name.includes('JsonWebToken')) {
    error = handleJWTError(err);
  } else if (err.code && err.code.startsWith('LIMIT_')) {
    error = handleMulterError(err);
  } else if (!err.isOperational) {
    // Convert unknown errors to operational errors
    error = new AppError('Something went wrong', 500);
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Close server & exit process
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  notFoundHandler,
  handleSequelizeError,
  handleJWTError,
  handleMulterError
};