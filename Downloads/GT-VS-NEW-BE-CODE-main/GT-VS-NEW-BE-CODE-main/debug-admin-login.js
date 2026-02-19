require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const Admin = require('./src/models/users/Admin');

(async function main() {
  try {
    await connectDB();
    console.log('\n=== ADMIN LOGIN DEBUG ===\n');

    // Find all admins
    const allAdmins = await Admin.find({ role: 'admin' }).select('+password');
    
    if (allAdmins.length === 0) {
      console.log('❌ NO ADMINS FOUND IN DATABASE');
      process.exit(0);
    }

    console.log(`Found ${allAdmins.length} admin(s):\n`);

    for (const admin of allAdmins) {
      console.log('────────────────────────────────────');
      console.log('Email:', admin.email);
      console.log('Name:', admin.firstName, admin.lastName);
      console.log('Role:', admin.role);
      console.log('AdminRole:', admin.adminRole);
      console.log('Status:', admin.status);
      console.log('Email Verified:', admin.emailVerified);
      console.log('2FA Enabled:', admin.is2FAEnabled);
      console.log('Has Password:', !!admin.password);
      
      // Check what would block login
      const issues = [];
      
      if (admin.status === 'Pending') {
        issues.push('❌ Status is "Pending" - account under review');
      } else if (admin.status === 'Rejected') {
        issues.push('❌ Status is "Rejected" - account rejected');
      } else if (admin.status === 'Delete') {
        issues.push('❌ Status is "Delete" - account deleted');
      } else if (admin.status === 'Suspend') {
        issues.push('❌ Status is "Suspend" - account suspended');
      } else if (admin.status === 'Inactive') {
        issues.push('❌ Status is "Inactive" - account inactive');
      } else if (admin.status === 'Active') {
        console.log('✅ Status is "Active"');
      } else {
        issues.push(`⚠️  Unknown status: "${admin.status}"`);
      }

      if (!admin.password) {
        issues.push('❌ No password set - using social login only');
      }

      if (!admin.emailVerified) {
        issues.push('❌ Email not verified');
      } else {
        console.log('✅ Email verified');
      }

      if (admin.is2FAEnabled) {
        issues.push('⚠️  2FA is enabled - will require OTP');
      } else {
        console.log('✅ 2FA disabled');
      }

      if (issues.length > 0) {
        console.log('\n🚨 LOGIN BLOCKERS:');
        issues.forEach(i => console.log('  ' + i));
      }

      if (admin.password) {
        console.log('\n🔐 Password hash exists (would accept login if all checks pass)');
      }

      console.log('────────────────────────────────────\n');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
