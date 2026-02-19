const https = require('https');

const data = JSON.stringify({
  email: 'keepingupwiththejonezez@gmail.com',
  password: 'Adminaszx12345'
});

const options = {
  hostname: 'gt-vs-new-be-code.vercel.app',
  port: 443,
  path: '/api/auth/login',
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
    console.log('\n===========================================');
    console.log(`Status Code: ${res.statusCode}`);
    console.log('===========================================');
    
    try {
      const json = JSON.parse(responseData);
      if (json.status === 'success') {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log('\nToken:', json.token ? '✓ Received' : '✗ Not received');
        if (json.data && json.data.user) {
          console.log('Email:', json.data.user.email);
          console.log('Role:', json.data.user.role);
        }
      } else {
        console.log('❌ LOGIN FAILED!');
        console.log('\nResponse:');
        console.log(JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.log('Raw Response:', responseData);
    }
    console.log('===========================================\n');
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
