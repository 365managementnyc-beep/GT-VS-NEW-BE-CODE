require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const Admin = require('./src/models/users/Admin');

(async function main() {
  try {
    await connectDB();

    const oldEmail = 'keepingupwiththejonezez@gmail.com';
    const newEmail = 'admin12345@gala.test';
    const newPassword = 'Adminaszx12345';
    
    // Find admin by old email
    let admin = await Admin.findOne({ email: oldEmail });
    
    if (!admin) {
      // If not found, find any admin
      admin = await Admin.findOne({ role: 'admin', adminRole: 'admin' });
    }

    if (!admin) {
      // Create new admin if none exists
      console.log('No admin found, creating new one...');
      admin = new Admin({
        firstName: 'Super',
        lastName: 'Admin',
        email: newEmail,
        password: newPassword,
        role: 'admin',
        adminRole: 'admin',
        status: 'Active',
        emailVerified: true,
        is2FAEnabled: false
      });
    } else {
      console.log('Found admin:', admin.email);
      // Update admin details
      admin.email = newEmail;
      admin.password = newPassword;
      admin.emailVerified = true;
      admin.is2FAEnabled = false;
      admin.status = 'Active';
    }
    
    await admin.save({ validateBeforeSave: false });
    
    console.log('✅ Admin updated successfully!');
    console.log('==========================================');
    console.log('Email:', newEmail);
    console.log('Password:', newPassword);
    console.log('Status:', admin.status);
    console.log('Email Verified:', admin.emailVerified);
    console.log('2FA Enabled:', admin.is2FAEnabled);
    console.log('==========================================');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
