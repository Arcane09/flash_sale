// Centralized error handler
// Use `next({ status: 400, message: 'Bad request' })` in controllers.

function errorHandler(err, req, res, next) {
  // eslint-disable-next-line no-console
  console.error(err);

  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    error: message,
  });
}

module.exports = { errorHandler };


