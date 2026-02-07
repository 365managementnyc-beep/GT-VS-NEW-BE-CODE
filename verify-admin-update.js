require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const Admin = require('./src/models/users/Admin');

(async function main() {
  try {
    await connectDB();
    
    const admin = await Admin.findOne({ role: 'admin', adminRole: 'admin' });
    
    if (!admin) {
      console.log('❌ No admin found!');
      process.exit(1);
    }
    
    console.log('✅ Admin found!');
    console.log('==========================================');
    console.log('Email:', admin.email);
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
