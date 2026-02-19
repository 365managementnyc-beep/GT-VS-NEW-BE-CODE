require('dotenv').config();
const AppError = require('../utils/appError');
const globalErrorHandler = require('../controllers/errorController');
const User = require('../models/users/User');

module.exports = (app) => {
  // ADMIN SETUP/FIX ENDPOINT (Temporary - for debugging only)
  // Usage: POST /setup-admin with body: { adminEmail, adminPassword }
  app.post('/setup-admin', async (req, res, next) => {
    try {
      const { adminEmail = 'umairathar@fabtechsol.com', adminPassword = 'Admin@12345' } = req.body;
      
      console.log('🔧 Setting up admin account:', adminEmail);
      
      let admin = await User.findOne({ email: adminEmail.toLowerCase() }).select('+password');
      
      if (!admin) {
        console.log('Creating new admin...');
        const Admin = require('../models/users/Admin');
        admin = new Admin({
          firstName: 'Super',
          lastName: 'Admin',
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          adminRole: 'admin',
          status: 'Active',
          emailVerified: true,
          is2FAEnabled: false,
          providers: ['local'],
          contact: '+1234567890',
          countryCode: '+1'
        });
      } else {
        console.log('Fixing existing admin...');
        admin.firstName = 'Super';
        admin.lastName = 'Admin';
        admin.role = 'admin';
        admin.adminRole = 'admin';
        admin.status = 'Active';
        admin.emailVerified = true;
        admin.is2FAEnabled = false;
        admin.password = adminPassword;
        admin.providers = ['local'];
      }
      
      await admin.save({ validateBeforeSave: false });
      
      res.status(200).json({
        status: 'success',
        message: 'Admin account setup complete!',
        data: {
          email: admin.email,
          password: adminPassword,
          role: admin.role,
          status: admin.status,
          emailVerified: admin.emailVerified,
          is2FAEnabled: admin.is2FAEnabled
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
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
