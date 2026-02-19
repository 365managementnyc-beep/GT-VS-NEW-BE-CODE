require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const Admin = require('./src/models/users/Admin');

(async function main() {
  try {
    await connectDB();

    const email = 'umairathar@fabtechsol.com';
    
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin not found with email:', email);
      
      // Check all admins
      const allAdmins = await Admin.find({ role: 'admin' });
      console.log('\nAll admins in database:');
      allAdmins.forEach(a => {
        console.log('- Email:', a.email, '| Status:', a.status);
      });
      
      process.exit(1);
    }

    console.log('✅ Admin found!');
    console.log('==========================================');
    console.log('Email:', admin.email);
    console.log('First Name:', admin.firstName);
    console.log('Last Name:', admin.lastName);
    console.log('Role:', admin.role);
    console.log('Admin Role:', admin.adminRole);
    console.log('Status:', admin.status);
    console.log('Email Verified:', admin.emailVerified);
    console.log('2FA Enabled:', admin.is2FAEnabled);
    console.log('Has Password:', !!admin.password);
    console.log('==========================================');
    
    // Test password
    const testPassword = 'Admin@12345';
    const isMatch = await admin.comparePasswords(testPassword, admin.password);
    console.log('Password "Admin@12345" matches:', isMatch);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
