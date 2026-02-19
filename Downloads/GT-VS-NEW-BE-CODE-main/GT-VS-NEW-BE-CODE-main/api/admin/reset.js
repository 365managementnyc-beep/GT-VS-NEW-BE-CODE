import mongoose from 'mongoose';
import Admin from '../../src/models/users/Admin.js';

export default async function handler(req, res) {
  // Require secret token for security
  const secretToken = process.env.ADMIN_RESET_SECRET || 'reset-secret-key-123';
  const providedToken = req.headers['x-admin-reset-token'];

  if (providedToken !== secretToken) {
    return res.status(401).json({
      status: 'fail',
      message: 'Unauthorized: Invalid or missing reset token'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      status: 'fail',
      message: 'Method not allowed. Use POST.'
    });
  }

  try {
    // Connect to MongoDB
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        connectTimeoutMS: 30000,
        socketTimeoutMS: 30000,
        serverSelectionTimeoutMS: 30000,
        maxPoolSize: 10,
        minPoolSize: 1
      });
      console.log('Connected to MongoDB');
    }

    const email = 'umairathar@fabtechsol.com';

    let admin = await Admin.findOne({ email });

    if (!admin) {
      console.log('Admin not found, creating new one...');
      admin = new Admin({
        firstName: 'Super',
        lastName: 'Admin',
        email: email,
        password: 'Admin@12345',
        role: 'admin',
        adminRole: 'admin',
        status: 'Active',
        emailVerified: true,
        is2FAEnabled: false
      });
    } else {
      console.log('Found admin:', admin.email);
      // Reset password
      admin.password = 'Admin@12345';
      admin.emailVerified = true;
      admin.is2FAEnabled = false;
      admin.status = 'Active';
    }

    await admin.save({ validateBeforeSave: false });

    return res.status(200).json({
      status: 'success',
      message: 'Admin reset successfully',
      data: {
        email: admin.email,
        password: 'Admin@12345',
        status: admin.status,
        emailVerified: admin.emailVerified,
        is2FAEnabled: admin.is2FAEnabled
      }
    });
  } catch (err) {
    console.error('Error resetting admin:', err);
    return res.status(500).json({
      status: 'fail',
      message: 'Error resetting admin',
      error: err.message
    });
  }
}
