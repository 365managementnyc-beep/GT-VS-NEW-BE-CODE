require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const Admin = require('./src/models/users/Admin');

(async function main() {
  try {
    await connectDB();

    const email = 'keepingupwiththejonezez@gmail.com';
    
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
    
    console.log('✅ Admin ready!');
    console.log('Email:', email);
    console.log('Password: Admin@12345');
    console.log('Status:', admin.status);
    console.log('Email Verified:', admin.emailVerified);
    console.log('2FA Enabled:', admin.is2FAEnabled);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
