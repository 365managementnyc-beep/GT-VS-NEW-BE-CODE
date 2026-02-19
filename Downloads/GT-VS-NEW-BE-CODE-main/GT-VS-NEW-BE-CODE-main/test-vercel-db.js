require('dotenv').config();
const axios = require('axios');

const BACKEND_URL = 'https://gt-vs-new-be-code-5p4x2who0-qs-projects-10333adc.vercel.app';

async function testBackendAndDatabase() {
  console.log('Testing Vercel Backend and MongoDB Connection...\n');
  
  // Test 1: Backend is running
  console.log('1️⃣ Testing if backend is running...');
  try {
    const response = await axios.get(`${BACKEND_URL}/`);
    console.log('✅ Backend is running!');
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('❌ Backend is NOT running!');
    console.log('   Error:', error.message);
    return;
  }
  
  // Test 2: Health endpoint
  console.log('\n2️⃣ Testing health endpoint...');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/health`);
    console.log('✅ Health endpoint working!');
    console.log('   Response:', response.data);
  } catch (error) {
    console.log('❌ Health endpoint failed!');
    console.log('   Error:', error.message);
  }
  
  // Test 3: Try login (this tests MongoDB)
  console.log('\n3️⃣ Testing login endpoint (this tests MongoDB connection)...');
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: 'admin@local.test',
      password: 'Admin@12345'
    }, {
      headers: { 'Content-Type': 'application/json' },
      validateStatus: () => true // Don't throw on any status
    });
    
    console.log('   Status:', response.status);
    console.log('   Response:', response.data);
    
    if (response.status === 200) {
      console.log('✅ MongoDB is working! Login successful!');
    } else if (response.status === 401 && response.data.message) {
      console.log('✅ MongoDB is connected! (Login failed but database is accessible)');
      console.log('   Reason:', response.data.message);
    } else {
      console.log('⚠️  Unexpected response from login');
    }
  } catch (error) {
    console.log('❌ Login endpoint failed!');
    console.log('   Error:', error.message);
    if (error.response) {
      console.log('   Response data:', error.response.data);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY:');
  console.log('Check the results above to see if MongoDB is working.');
  console.log('If login returned status 200 or 401, MongoDB IS connected.');
  console.log('If you see connection errors, MongoDB is NOT connected.');
}

testBackendAndDatabase();
