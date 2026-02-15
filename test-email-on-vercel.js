const https = require('https');

console.log('\n🧪 Testing Email Service on Vercel Backend...\n');
console.log('==========================================\n');

// Test email verification endpoint
async function testEmailVerification() {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      email: 'keepingupwiththejonezez@gmail.com'
    });

    const options = {
      hostname: 'gt-vs-new-be-code.vercel.app',
      port: 443,
      path: '/api/auth/send-otp-email',
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
        console.log('📧 Email Verification Test:');
        console.log('─────────────────────────────────────');
        console.log(`Status Code: ${res.statusCode}`);
        
        try {
          const json = JSON.parse(responseData);
          console.log('Response:', JSON.stringify(json, null, 2));
          
          if (res.statusCode === 200 && json.status === 'success') {
            console.log('\n✅ Email service appears to be working!');
          } else if (json.message && json.message.includes('email')) {
            console.log('\n⚠️  Email-related error detected');
          } else {
            console.log('\n❓ Unclear email service status');
          }
        } catch (e) {
          console.log('Response:', responseData);
        }
        console.log('==========================================\n');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request Error:', error.message);
      resolve();
    });

    req.setTimeout(15000, () => {
      req.destroy();
      console.log('❌ Request Timeout');
      resolve();
    });

    req.write(data);
    req.end();
  });
}

testEmailVerification();
