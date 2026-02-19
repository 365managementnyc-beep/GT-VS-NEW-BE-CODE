require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const Admin = require('./src/models/users/Admin');

(async function main() {
  try {
    await connectDB();

    const oldEmail = 'admin@local.test';
    const newEmail = 'keepingupwiththejonezez@gmail.com';

    // Find admin by old email or by role
    let admin = await Admin.findOne({ email: oldEmail });
    
    if (!admin) {
      // If not found by old email, find any admin
      admin = await Admin.findOne({ role: 'admin', adminRole: 'admin' });
    }

    if (!admin) {
      console.log('No admin found to update');
      process.exit(1);
    }

    console.log('Found admin:', admin.email);
    
    // Update email
    admin.email = newEmail;
    admin.status = 'Active';
    
    await admin.save({ validateBeforeSave: false });
    
    console.log('Admin email updated successfully!');
    console.log('New Email:', newEmail);
    console.log('Password: Admin@12345');
    
    process.exit(0);
  } catch (err) {
    console.error('Error updating admin:', err);
    process.exit(1);
  }
})();
