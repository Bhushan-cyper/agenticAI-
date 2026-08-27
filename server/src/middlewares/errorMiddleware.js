const errorHandler = (err, req, res, next) => {
  console.error('🔥 Error Encountered:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'SERVER_ERROR';

  // Handle specific provider errors
  if (err.message && (err.message.includes('API key') || err.message.includes('authentication'))) {
    errorCode = 'PROVIDER_NOT_CONFIGURED';
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
    errorCode = 'DUPLICATE_KEY_ERROR';
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((val) => val.message).join(', ');
    errorCode = 'VALIDATION_ERROR';
  }

  res.status(statusCode).json({
    success: false,
    errorCode,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = { errorHandler };
