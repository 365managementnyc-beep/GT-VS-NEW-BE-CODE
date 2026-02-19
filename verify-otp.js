const https = require('https');

const data = JSON.stringify({
  email: 'keepingupwiththejonezez@gmail.com',
  otp: '714391'
});

console.log('\n🔐 Verifying OTP Code...\n');
console.log('Email: keepingupwiththejonezez@gmail.com');
console.log('OTP: 714391\n');

const options = {
  hostname: 'gt-vs-new-be-code.vercel.app',
  port: 443,
  path: '/api/auth/verifyotp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log('═══════════════════════════════════════');
    console.log(`Status Code: ${res.statusCode}`);
    console.log('═══════════════════════════════════════\n');
    
    try {
      const json = JSON.parse(responseData);
      
      if (res.statusCode === 200 && json.status === 'success') {
        console.log('✅ OTP VERIFIED SUCCESSFULLY!\n');
        console.log('Message:', json.message);
        if (json.data) {
          console.log('\nAccount Details:');
          console.log('  User ID:', json.data.userId || json.data._id);
          console.log('  Email:', json.data.email);
          console.log('  Email Verified:', json.data.emailVerified);
        }
        console.log('\n✓ Email verification complete!');
        console.log('✓ Account fully activated!\n');
      } else {
        console.log('❌ OTP VERIFICATION FAILED!\n');
        console.log('Response:');
        console.log(JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.log('Raw Response:', responseData);
    }
    console.log('═══════════════════════════════════════\n');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.setTimeout(15000, () => {
  req.destroy();
  console.log('❌ Request Timeout');
});

req.write(data);
req.end();
