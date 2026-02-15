const https = require('https');

// Test credentials - UPDATE THESE WITH THE ACTUAL CREDENTIALS YOU'RE TRYING TO USE
const credentials = {
  email: 'your-email@example.com',  // UPDATE THIS
  password: 'your-password'          // UPDATE THIS
};

const data = JSON.stringify(credentials);

console.log('\n🔍 DEBUGGING LOGIN ISSUE');
console.log('===========================================');
console.log('Testing from:', require('os').hostname());
console.log('Email:', credentials.email);
console.log('Backend:', 'https://gt-vs-new-be-code.vercel.app');
console.log('===========================================\n');

const options = {
  hostname: 'gt-vs-new-be-code.vercel.app',
  port: 443,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Accept': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  console.log(`📡 Response Status: ${res.statusCode}`);
  console.log(`📋 Response Headers:`, res.headers);
  console.log('-------------------------------------------\n');

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('📦 Full Response Body:');
    console.log(responseData);
    console.log('\n===========================================');
    
    try {
      const json = JSON.parse(responseData);
      
      if (json.status === 'success') {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('\n📊 Response Details:');
        console.log('  - Token:', json.token ? '✓ Received' : '✗ Not received');
        console.log('  - User ID:', json.data?._id);
        console.log('  - Email:', json.data?.email);
        console.log('  - Role:', json.data?.role);
        console.log('  - Status:', json.data?.status);
        console.log('  - 2FA Enabled:', json.data?.is2FAEnabled);
        console.log('  - Email Verified:', json.data?.emailVerified);
        if (json.redirecttologin) {
          console.log('  ⚠️  Redirect to login required (2FA setup needed)');
        }
      } else {
        console.log('❌ LOGIN FAILED!');
        console.log('\n🔴 Error Details:');
        console.log('  - Status:', json.status);
        console.log('  - Message:', json.message);
        
        if (json.error) {
          console.log('\n📝 Error Fields:');
          if (typeof json.error === 'object') {
            Object.entries(json.error).forEach(([key, value]) => {
              console.log(`    - ${key}: ${value}`);
            });
          } else {
            console.log(`    - ${json.error}`);
          }
        }
        
        console.log('\n💡 Possible Issues:');
        if (json.message?.includes('Invalid credentials')) {
          console.log('  - Check if email and password are correct');
          console.log('  - Verify password is case-sensitive');
        } else if (json.message?.includes('Pending')) {
          console.log('  - Account is waiting for admin approval');
        } else if (json.message?.includes('Rejected')) {
          console.log('  - Account was rejected by admin');
        } else if (json.message?.includes('Delete')) {
          console.log('  - Account has been deleted');
        } else if (json.message?.includes('Suspend') || json.message?.includes('Inactive')) {
          console.log('  - Account is suspended or inactive');
        } else if (json.message?.includes('social login')) {
          console.log('  - This account uses Google/Facebook login');
          console.log('  - Use social login button instead');
        }
      }
    } catch (e) {
      console.log('⚠️  Could not parse JSON response');
      console.log('Raw Response:', responseData);
      console.log('Parse Error:', e.message);
    }
    console.log('===========================================\n');
  });
});

req.on('error', (error) => {
  console.error('\n❌ CONNECTION ERROR!');
  console.error('Error:', error.message);
  console.error('\n💡 Possible causes:');
  console.error('  - No internet connection');
  console.error('  - Firewall blocking the request');
  console.error('  - Backend server is down');
  console.error('  - DNS resolution issue');
  console.error('\nFull Error:', error);
});

req.write(data);
req.end();
