require('dotenv').config({ path: '.env.vercel.prod' });
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI || process.env.MONGO_URL;
if (!uri) { console.log('No MONGO_URL found in .env.vercel'); process.exit(1); }

mongoose.connect(uri).then(async () => {
  console.log('Connected to production MongoDB');
  const User = require('./src/models/users/User');

  // Check the test user we just created
  const testUser = await User.findById('69a24ab2dd7d36688a65da02').select('email state city firstName createdAt');
  if (testUser) {
    console.log('\n=== TEST USER (just created) ===');
    console.log('Email:', testUser.email);
    console.log('State:', testUser.state || 'EMPTY/UNDEFINED');
    console.log('City:', testUser.city || 'EMPTY/UNDEFINED');
  } else {
    console.log('\nTest user not found (may be on a different cluster)');
  }

  // Check 10 most recent users
  console.log('\n=== 10 MOST RECENT USERS ===');
  const users = await User.find({}).select('email state city createdAt').sort({ createdAt: -1 }).limit(10);
  users.forEach(u => {
    console.log(`${u.email} | state: ${u.state || 'EMPTY'} | city: ${u.city || 'EMPTY'}`);
  });

  mongoose.disconnect();
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
