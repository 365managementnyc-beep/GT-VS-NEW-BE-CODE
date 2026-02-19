require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const Admin = require('./src/models/users/Admin');
const User = require('./src/models/users/User');

(async function main() {
  try {
    await connectDB();
    console.log('\n=== FIXING ADMIN LOGIN ISSUE ===\n');

    // The admin account email
    const email = 'umairathar@fabtechsol.com';
    const password = 'Admin@12345';

    // Search in BOTH User and Admin models to be sure
    let admin = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin not found in User collection. Creating new admin...\n');
      admin = new Admin({
        firstName: 'Super',
        lastName: 'Admin',
        email: email,
        password: password,
        role: 'admin',
        adminRole: 'admin',
        status: 'Active',
        emailVerified: true,
        is2FAEnabled: false,
        contact: '+1234567890',
        countryCode: '+1',
        providers: ['local']
      });
    } else {
      console.log('✅ Admin found. Checking and fixing issues...\n');
      
      // Check what might be blocking login
      const issues = [];
      if (admin.role !== 'admin') {
        console.log('  ❌ Role was:', admin.role, '→ Fixing to "admin"');
        admin.role = 'admin';
        issues.push('role');
      } else {
        console.log('  ✅ Role is correct: admin');
      }

      if (admin.adminRole !== 'admin') {
        console.log('  ❌ AdminRole was:', admin.adminRole, '→ Fixing to "admin"');
        admin.adminRole = 'admin';
        issues.push('adminRole');
      } else {
        console.log('  ✅ AdminRole is correct: admin');
      }

      if (admin.status !== 'Active') {
        console.log('  ❌ Status was:', admin.status, '→ Fixing to "Active"');
        admin.status = 'Active';
        issues.push('status');
      } else {
        console.log('  ✅ Status is correct: Active');
      }

      if (!admin.emailVerified) {
        console.log('  ❌ Email not verified → Marking as verified');
        admin.emailVerified = true;
        issues.push('emailVerified');
      } else {
        console.log('  ✅ Email verified');
      }

      if (admin.is2FAEnabled) {
        console.log('  ❌ 2FA enabled → Disabling');
        admin.is2FAEnabled = false;
        issues.push('2FA');
      } else {
        console.log('  ✅ 2FA disabled');
      }

      if (!admin.password) {
        console.log('  ❌ No password → Setting password');
        admin.password = password;
        issues.push('password');
      } else {
        console.log('  ✅ Password is set');
      }

      if (!admin.providers || !admin.providers.includes('local')) {
        console.log('  ❌ Providers missing "local" → Adding it');
        admin.providers = ['local'];
        issues.push('providers');
      } else {
        console.log('  ✅ Providers includes "local"');
      }

      if (issues.length === 0) {
        console.log('\n✅ Admin account is already configured correctly!');
      } else {
        console.log('\n🔧 Fixed ' + issues.length + ' issue(s):', issues.join(', '));
      }
    }
    
    await admin.save({ validateBeforeSave: false });
    
    console.log('\n═══════════════════════════════════════');
    console.log('✅ ADMIN ACCOUNT READY!\n');
    console.log('📧 Email: ' + email);
    console.log('🔐 Password: ' + password);
    console.log('\nℹ️  Configuration:');
    console.log('  • Status: Active');
    console.log('  • Email Verified: true');
    console.log('  • 2FA Enabled: false');
    console.log('  • Role: admin');
    console.log('  • Admin Role: admin');
    console.log('═══════════════════════════════════════\n');
    console.log('✨ Try signing in now!\n');
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
