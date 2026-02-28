// Test script: verify state is saved correctly during signup
// Run: node test-state-save.js

const https = require('https');
const http = require('http');

const BASE_URL = 'https://gt-vs-new-be-code.vercel.app';

function makeRequest(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseData) });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseData });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const testEmail = `test-state-${Date.now()}@testdebug.com`;
  
  console.log('\n=== TEST: State Save During Signup ===\n');

  // Get countries
  console.log('1. Fetching countries...');
  const countryRes = await makeRequest('GET', '/api/country/getCountriesNames', null);
  
  let usCountry;
  if (countryRes.status === 200) {
    const raw = countryRes.body;
    const list = raw?.data || raw?.countries || [];
    const arr = Array.isArray(list) ? list : [];
    usCountry = arr.find(c => 
      c.country?.toLowerCase().includes('united states') ||
      c.country?.toLowerCase() === 'us' ||
      c.country?.toLowerCase() === 'usa'
    );
    if (!usCountry && arr.length > 0) {
      console.log('Countries sample:', arr.slice(0, 5).map(c => c.country));
    }
    if (usCountry) console.log('✅ Found US Country ID:', usCountry._id);
  } else {
    console.log('Country API response:', countryRes.status, JSON.stringify(countryRes.body).slice(0, 300));
  }

  if (!usCountry) {
    console.log('\n❌ Could not get US country ID');
    return;
  }

  const signupPayload = {
    firstName: 'TestState',
    lastName: 'Debug',
    email: testEmail,
    password: 'Test@123456',
    contact: '+16502530000',  // Google HQ - valid US number
    countryCode: '+1',
    countryName: 'US',
    city: 'Los Angeles',
    state: 'California',
    country: usCountry._id,
    role: 'customer',
    providers: ['local'],
  };

  console.log('\n2. Registering user with state:', signupPayload.state, '| city:', signupPayload.city);
  const registerRes = await makeRequest('POST', '/api/auth/register', signupPayload);
  console.log('   HTTP Status:', registerRes.status);
  
  if (registerRes.status !== 200) {
    console.log('\n❌ SIGNUP FAILED');
    console.log(JSON.stringify(registerRes.body, null, 2));
    return;
  }
  
  console.log('✅ Signup succeeded! User ID:', registerRes.body?.data?._id);
  console.log('\nCheck Vercel logs now for:');
  console.log('  [registerUser DEBUG] saved state: California | ...');
  console.log('  Email used:', testEmail);
}

main().catch(console.error);
