const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ${err.stack || err.message}`);

  // SQLite constraint errors
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    const field = err.message.split('UNIQUE constraint failed: ')[1] || 'field';
    return res.status(409).json({
      success: false,
      message: `Duplicate entry: ${field} already exists.`,
    });
  }

  if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json({
      success: false,
      message: 'Referenced resource does not exist.',
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({ success: false, message });
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
};

module.exports = { errorHandler, notFound };
