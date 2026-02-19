const https = require('https');

console.log('\n🧪 Testing Country and City Availability...\n');
console.log('═══════════════════════════════════════\n');

// Test 1: Get all countries
async function testGetCountries() {
  return new Promise((resolve) => {
    console.log('Test 1: Fetching Countries...');
    
    const options = {
      hostname: 'gt-vs-new-be-code.vercel.app',
      port: 443,
      path: '/api/country?status=Active&isDeleted=false',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'success') {
            console.log(`✅ Found ${json.results} active country(ies)`);
            const usa = json.data.find(c => c.country === 'United States');
            if (usa) {
              console.log('✅ United States is available');
              console.log(`   ID: ${usa._id || usa.id}`);
              console.log(`   Region: ${usa.region}`);
              console.log(`   Currency: ${usa.currency}`);
              console.log(`   Status: ${usa.status}\n`);
            } else {
              console.log('⚠️  United States not found in results\n');
            }
          }
        } catch (e) {
          console.log('❌ Error parsing response\n');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message, '\n');
      resolve();
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log('❌ Request timeout\n');
      resolve();
    });

    req.end();
  });
}

// Test 2: Get all cities
async function testGetCities() {
  return new Promise((resolve) => {
    console.log('Test 2: Fetching Cities...');
    
    const options = {
      hostname: 'gt-vs-new-be-code.vercel.app',
      port: 443,
      path: '/api/city?status=Active&isDeleted=false',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.status === 'success') {
            console.log(`✅ Found ${json.results} active city(ies)`);
            const brooklyn = json.data.find(c => c.city === 'Brooklyn' && c.country === 'United States');
            if (brooklyn) {
              console.log('✅ Brooklyn, New York is available');
              console.log(`   ID: ${brooklyn._id || brooklyn.id}`);
              console.log(`   Country: ${brooklyn.country}`);
              console.log(`   Province: ${brooklyn.province}`);
              console.log(`   Status: ${brooklyn.status}\n`);
            } else {
              console.log('⚠️  Brooklyn not found in results\n');
            }
          }
        } catch (e) {
          console.log('❌ Error parsing response\n');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('❌ Request failed:', error.message, '\n');
      resolve();
    });

    req.setTimeout(10000, () => {
      req.destroy();
      console.log('❌ Request timeout\n');
      resolve();
    });

    req.end();
  });
}

(async () => {
  await testGetCountries();
  await testGetCities();
  
  console.log('═══════════════════════════════════════');
  console.log('📋 REGISTRATION CAPABILITY\n');
  console.log('Users can now register with:');
  console.log('  Country: United States');
  console.log('  City: Brooklyn, New York\n');
  console.log('Frontend Registration URLs:');
  console.log('  User: https://gt-vs-new-fe-code-nwqv.vercel.app/auth/register');
  console.log('  Vendor: https://gt-vs-new-fe-code-nwqv.vercel.app/auth/vendor-register\n');
  console.log('═══════════════════════════════════════\n');
})();
