require('dotenv').config();
const AppError = require('../utils/appError');
const globalErrorHandler = require('../controllers/errorController');

module.exports = (app) => {
  // 404 handler for unknown routes
  app.all('/*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });

  // Global error handler
  app.use(globalErrorHandler);
};
