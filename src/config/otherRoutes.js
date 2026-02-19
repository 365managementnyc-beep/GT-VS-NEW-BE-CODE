require('dotenv').config();
const AppError = require('../utils/appError');
const globalErrorHandler = require('../controllers/errorController');
const User = require('../models/users/User');

module.exports = (app) => {
  // Admin reset endpoint (protected)
  // Usage: POST /api/admin/reset
  // Headers: x-admin-reset-token: <ADMIN_RESET_SECRET>
  // Body: { email, password }
  app.post('/api/admin/reset', async (req, res) => {
    const secretToken = process.env.ADMIN_RESET_SECRET;
    if (!secretToken) {
      return res.status(500).json({
        status: 'fail',
        message: 'ADMIN_RESET_SECRET is not configured on the server'
      });
    }

    const providedToken = req.headers['x-admin-reset-token'];
    if (!providedToken || providedToken !== secretToken) {
      return res.status(401).json({
        status: 'fail',
        message: 'Unauthorized: Invalid or missing reset token'
      });
    }

    try {
      const rawEmail = req.body?.email || 'umairathar@fabtechsol.com';
      const rawPassword = req.body?.password || 'Admin@12345';

      const email = String(rawEmail).trim().toLowerCase();
      const password = String(rawPassword);

      // Look up by base User model first so we don't trip unique index if this email exists.
      let admin = await User.findOne({ email }).select('+password');

      if (!admin) {
        const Admin = require('../models/users/Admin');
        admin = new Admin({
          firstName: 'Super',
          lastName: 'Admin',
          email,
          password,
          role: 'admin',
          adminRole: 'admin',
          status: 'Active',
          emailVerified: true,
          is2FAEnabled: false,
          providers: ['local']
        });
      }

      admin.role = 'admin';
      admin.adminRole = 'admin';
      admin.status = 'Active';
      admin.emailVerified = true;
      admin.is2FAEnabled = false;
      admin.providers = ['local'];
      admin.password = password;

      // Avoid failing on unrelated schema required fields in legacy data.
      await admin.save({ validateBeforeSave: false });

      return res.status(200).json({
        status: 'success',
        message: 'Admin reset successfully',
        data: {
          email: admin.email,
          status: admin.status,
          emailVerified: admin.emailVerified,
          is2FAEnabled: admin.is2FAEnabled
        }
      });
    } catch (error) {
      return res.status(500).json({
        status: 'fail',
        message: 'Error resetting admin',
        error: error.message
      });
    }
  });

  // 404 handler for unknown routes
  app.all('/*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  });

  // Global error handler
  app.use(globalErrorHandler);
};
