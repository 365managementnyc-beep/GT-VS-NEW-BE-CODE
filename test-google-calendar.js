/**
 * Test script for Google Calendar OAuth integration
 * Run this script to test the basic functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:2000/api';
let userToken = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual user JWT

const testGoogleCalendarIntegration = async () => {
  console.log('🔄 Testing Google Calendar OAuth Integration...\n');

  try {
    // Test 1: Check calendar connection status
    console.log('1. Checking calendar connection status...');
    const statusResponse = await axios.get(`${BASE_URL}/calendar/google-auth/status`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    console.log('✅ Status check:', statusResponse.data);

    // Test 2: Get Google authorization URL
    console.log('\n2. Getting Google authorization URL...');
    const authResponse = await axios.get(`${BASE_URL}/calendar/google-auth/url`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    console.log('✅ Auth URL generated:', authResponse.data.data.authUrl);
    console.log('👆 Use this URL to authorize your Google Calendar access');

    // Test 3: Try to get vendor calendar events (will fail if not connected)
    console.log('\n3. Attempting to get vendor calendar events...');
    try {
      const eventsResponse = await axios.get(`${BASE_URL}/calendar/vendor/events`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      console.log('✅ Vendor events retrieved:', eventsResponse.data);
    } catch (error) {
      if (error.response?.data?.code === 'CALENDAR_NOT_CONNECTED') {
        console.log('⚠️  Expected: Calendar not connected. Complete OAuth flow first.');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test 4: Test admin calendar (should work with service account)
    console.log('\n4. Testing admin calendar access...');
    try {
      const adminResponse = await axios.get(`${BASE_URL}/calendar/admin/events`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      console.log('✅ Admin calendar accessed:', adminResponse.data);
    } catch (error) {
      console.log('❌ Admin calendar error:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

// Example of how to create an event after OAuth is complete
const testCreateEvent = async () => {
  const eventData = {
    summary: "Test Meeting",
    description: "Test event created via API",
    startDateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    endDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    timeZone: "UTC",
    attendees: ["test@example.com"],
    location: "Virtual"
  };

  try {
    const response = await axios.post(`${BASE_URL}/calendar/vendor/events`, eventData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      }
    });
    console.log('✅ Event created:', response.data);
  } catch (error) {
    console.log('❌ Event creation failed:', error.response?.data || error.message);
  }
};

// Run tests
if (require.main === module) {
  if (!userToken || userToken === 'YOUR_JWT_TOKEN_HERE') {
    console.log('❌ Please set a valid JWT token in the userToken variable');
    console.log('You can get this by logging in a user and copying their JWT token');
    process.exit(1);
  }
  
  testGoogleCalendarIntegration();
}

module.exports = {
  testGoogleCalendarIntegration,
  testCreateEvent
};
