require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const Admin = require('./src/models/users/Admin');

(async function main() {
  try {
    await connectDB();

    const email = process.env.NEW_ADMIN_EMAIL || 'admin@local.test';
    const password = process.env.NEW_ADMIN_PASSWORD || 'Admin@12345';
    const firstName = process.env.NEW_ADMIN_FIRSTNAME || 'Super';
    const lastName = process.env.NEW_ADMIN_LASTNAME || 'Admin';

    const existing = await Admin.findOne({ email }).lean();
    if (existing) {
      console.log('Admin already exists:', email);
      process.exit(0);
    }

    const admin = new Admin({
      firstName,
      lastName,
      email,
      password,
      role: 'admin',
      adminRole: 'admin',
      status: 'Active'
    });

    await admin.save({ validateBeforeSave: false });
    console.log('Admin created successfully');
    console.log('Email:', email);
    console.log('Password:', password);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err);
    process.exit(1);
  }
})();
