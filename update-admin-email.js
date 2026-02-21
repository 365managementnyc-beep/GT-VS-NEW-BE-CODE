require('dotenv').config();
const { connectDB } = require('./src/config/connectDb');
const Admin = require('./src/models/users/Admin');

(async function main() {
  try {
    await connectDB();

    const oldEmail = 'UMAIR.ATHAR@FABTECHSOL.COM';
    const newEmail = 'keepingupwiththejonezez@gmail.com';

    let admin = await Admin.findOne({ email: oldEmail });

    if (!admin) {
      console.log('No admin found with email:', oldEmail);
      process.exit(1);
    }

    console.log('Found admin:', admin.email);

    admin.email = newEmail;
    admin.status = 'Active';

    await admin.save({ validateBeforeSave: false });

    console.log('Admin email updated successfully!');
    console.log('Old Email:', oldEmail);
    console.log('New Email:', newEmail);
    console.log('Password: unchanged');
    
    process.exit(0);
  } catch (err) {
    console.error('Error updating admin:', err);
    process.exit(1);
  }
})();
