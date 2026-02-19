const https = require('https');

console.log('Testing Vercel Backend MongoDB Connection...\n');

const testEndpoints = [
  { name: 'Health Check', path: '/api/health' },
  { name: 'MongoDB Test', path: '/api/test-db' }
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'gt-vs-new-be-code.vercel.app',
      port: 443,
      path: endpoint.path,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`\n${endpoint.name} (${endpoint.path})`);
        console.log('Status Code:', res.statusCode);
        try {
          const json = JSON.parse(data);
          console.log('Response:', JSON.stringify(json, null, 2));
          resolve({ success: res.statusCode === 200, data: json });
        } catch (e) {
          console.log('Response:', data);
          resolve({ success: false, error: 'Invalid JSON' });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`\n${endpoint.name} - ERROR`);
      console.error('Error:', error.message);
      resolve({ success: false, error: error.message });
    });

    req.setTimeout(15000, () => {
      req.destroy();
      console.log(`\n${endpoint.name} - TIMEOUT`);
      resolve({ success: false, error: 'Timeout' });
    });

    req.end();
  });
}

(async () => {
  console.log('Testing endpoints...');
  console.log('==========================================\n');
  
  for (const endpoint of testEndpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('\n==========================================');
})();
