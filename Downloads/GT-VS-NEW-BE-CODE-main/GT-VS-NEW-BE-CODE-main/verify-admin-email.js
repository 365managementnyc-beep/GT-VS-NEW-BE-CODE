require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const Admin = require('./src/models/users/Admin');

(async function main() {
  try {
    await connectDB();

    const updated = await Admin.findOneAndUpdate(
      { email: 'admin@example.com' },
      { emailVerified: true },
      { new: true }
    );

    if (updated) {
      console.log('Admin email verified:', updated.email);
    } else {
      console.log('Admin not found');
    }
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
