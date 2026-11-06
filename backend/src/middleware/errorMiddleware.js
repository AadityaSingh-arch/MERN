export const notFound = (req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` });

export const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'That file is too large' });
  if (err.name === 'MulterError') return res.status(400).json({ message: err.message });
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid identifier supplied' });
  res.status(err.statusCode || 500).json({ message: err.message || 'Internal server error' });
};
