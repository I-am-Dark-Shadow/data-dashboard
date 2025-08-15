// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      details: 'Maximum file size is 50MB'
    });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Invalid file upload',
      details: 'Only one file is allowed'
    });
  }

  // Database errors
  if (err.code === 'ER_NO_SUCH_TABLE') {
    return res.status(500).json({
      error: 'Database not properly configured',
      details: 'Please run database migrations'
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(500).json({
      error: 'Database connection failed',
      details: 'Please check if MySQL is running'
    });
  }

  // File type errors
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      details: 'Only CSV and Excel files are allowed'
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

export default errorHandler;