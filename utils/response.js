  
// Standard API response formatter

const sendSuccess = (res, message = 'Success', data = null, statusCode = 200, meta = null) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors !== null) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

const sendCreated = (res, message = 'Created successfully', data = null) => {
  return sendSuccess(res, message, data, 201);
};

const sendUpdated = (res, message = 'Updated successfully', data = null) => {
  return sendSuccess(res, message, data, 200);
};

const sendDeleted = (res, message = 'Deleted successfully') => {
  return sendSuccess(res, message, null, 200);
};

const sendNotFound = (res, message = 'Data not found') => {
  return sendError(res, message, 404);
};

const sendBadRequest = (res, message = 'Bad request', errors = null) => {
  return sendError(res, message, 400, errors);
};

const sendUnauthorized = (res, message = 'Unauthorized') => {
  return sendError(res, message, 401);
};

const sendForbidden = (res, message = 'Forbidden') => {
  return sendError(res, message, 403);
};

const sendConflict = (res, message = 'Data already exists') => {
  return sendError(res, message, 409);
};

const sendValidationError = (res, errors) => {
  return sendError(res, 'Validation failed', 422, errors);
};

const sendPaginated = (res, data, pagination, message = 'Data retrieved successfully') => {
  const meta = {
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.limit),
      hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
      hasPrev: pagination.page > 1
    }
  };

  return sendSuccess(res, message, data, 200, meta);
};

const sendWithCount = (res, data, count, message = 'Data retrieved successfully') => {
  const meta = {
    count: count
  };

  return sendSuccess(res, message, data, 200, meta);
};

// Response helper untuk file uploads
const sendFileUploaded = (res, fileInfo, message = 'File uploaded successfully') => {
  return sendSuccess(res, message, {
    filename: fileInfo.filename,
    originalname: fileInfo.originalname,
    size: fileInfo.size,
    mimetype: fileInfo.mimetype,
    path: fileInfo.path
  }, 201);
};

// Response helper untuk bulk operations
const sendBulkResult = (res, results, message = 'Bulk operation completed') => {
  const meta = {
    total: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  };

  return sendSuccess(res, message, results, 200, meta);
};

// Format error untuk development
const formatDevError = (error) => {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(error.errors && { validationErrors: error.errors })
  };
};

// Format error untuk production
const formatProdError = (error) => {
  return {
    message: error.isOperational ? error.message : 'Something went wrong'
  };
};

// Helper untuk transform data sebelum response
const transformData = (data, transformer) => {
  if (!transformer || typeof transformer !== 'function') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(transformer);
  }

  return transformer(data);
};

// Response helper dengan data transformation
const sendTransformed = (res, data, transformer, message = 'Success') => {
  const transformedData = transformData(data, transformer);
  return sendSuccess(res, message, transformedData);
};

module.exports = {
  sendSuccess,
  sendError,
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendNotFound,
  sendBadRequest,
  sendUnauthorized,
  sendForbidden,
  sendConflict,
  sendValidationError,
  sendPaginated,
  sendWithCount,
  sendFileUploaded,
  sendBulkResult,
  sendTransformed,
  formatDevError,
  formatProdError,
  transformData
};