require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing MongoDB Connection...\n');
console.log('MongoDB URI:', process.env.MONGO_URI?.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));

async function testConnection() {
  try {
    console.log('\nAttempting to connect...');
    await mongoose.connect(process.env.MONGO_URI, {
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000
    });
    
    console.log('✅ SUCCESS! Connected to MongoDB Atlas');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    
    await mongoose.connection.close();
    console.log('Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ FAILED! Could not connect to MongoDB');
    console.error('Error:', error.message);
    
    if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.log('\n🔧 FIX: Add 0.0.0.0/0 to MongoDB Atlas Network Access');
      console.log('   1. Go to https://cloud.mongodb.com/');
      console.log('   2. Click "Network Access"');
      console.log('   3. Click "ADD IP ADDRESS"');
      console.log('   4. Select "ALLOW ACCESS FROM ANYWHERE"');
      console.log('   5. Click "Confirm"');
    }
    
    process.exit(1);
  }
}

testConnection();
