require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const Admin = require('./src/models/users/Admin');

(async function main() {
  try {
    await connectDB();

    const allowedEmail = 'keepingupwiththejonezez@gmail.com';

    const keepAdmin = await Admin.findOne({ email: allowedEmail, role: 'admin' });
    if (!keepAdmin) {
      console.log('Allowed admin email not found:', allowedEmail);
      process.exit(1);
    }

    const updateResult = await Admin.updateMany(
      { role: 'admin', email: { $ne: allowedEmail } },
      {
        $set: {
          status: 'Inactive',
          emailVerified: false,
          is2FAEnabled: false
        }
      }
    );

    const allAdmins = await Admin.find({ role: 'admin' })
      .select('email status adminRole emailVerified is2FAEnabled')
      .lean();

    console.log('✅ Enforcement complete');
    console.log('Allowed admin login email:', allowedEmail);
    console.log('Disabled other admin accounts:', updateResult.modifiedCount);
    console.log('Current admin accounts:', JSON.stringify(allAdmins, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Enforcement failed:', err);
    process.exit(1);
  }
})();
