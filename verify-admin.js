require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const Admin = require('./src/models/users/Admin');

(async function main() {
  try {
    await connectDB();

    const email = 'keepingupwiththejonezez@gmail.com';
    
    const admin = await Admin.findOne({ email });
    
    if (!admin) {
      console.log('Admin not found');
      process.exit(1);
    }

    console.log('Found admin:', admin.email);
    
    // Verify email and disable 2FA
    admin.emailVerified = true;
    admin.is2FAEnabled = false;
    admin.status = 'Active';
    
    await admin.save({ validateBeforeSave: false });
    
    console.log('Admin verified successfully!');
    console.log('Email:', email);
    console.log('Password: Admin@12345');
    console.log('Email Verified: true');
    console.log('2FA Enabled: false');
    
    process.exit(0);
  } catch (err) {
    console.error('Error verifying admin:', err);
    process.exit(1);
  }
})();
