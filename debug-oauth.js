/**
 * Google OAuth Debugging and Testing
 * Use this file to test and debug OAuth issues
 */

console.log('🔍 Google OAuth Configuration Debug');
console.log('=====================================');

// Check environment variables
console.log('Environment Variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI || '❌ Missing');
console.log('PORT:', process.env.PORT || '❌ Missing');

// Expected URLs
const serverPort = process.env.PORT || 4100;
const expectedRedirectUri = `http://localhost:${serverPort}/api/auth/login/google/callback`;

console.log('\n🌐 URLs:');
console.log('Expected Redirect URI:', expectedRedirectUri);
console.log('Configured Redirect URI:', process.env.GOOGLE_REDIRECT_URI);
console.log('Match:', expectedRedirectUri === process.env.GOOGLE_REDIRECT_URI ? '✅' : '❌');

console.log('\n📋 Google Cloud Console Setup Checklist:');
console.log('1. ✅ Google Calendar API enabled');
console.log('2. ✅ OAuth 2.0 Client ID created');
console.log('3. ✅ Authorized redirect URIs includes:', expectedRedirectUri);
console.log('4. ✅ OAuth consent screen configured');

console.log('\n🔗 Test URLs:');
console.log('Login with Google (vendor):', `http://localhost:${serverPort}/api/auth/login/withGoogle?role=vendor`);
console.log('Login with Google (customer):', `http://localhost:${serverPort}/api/auth/login/withGoogle?role=customer`);

console.log('\n🚨 Common Issues:');
console.log('1. Redirect URI mismatch - Make sure Google Console has the exact URL');
console.log('2. Missing role parameter - Always include ?role=vendor or ?role=customer');
console.log('3. Calendar permissions - Make sure OAuth consent includes calendar scopes');
console.log('4. Environment variables - Check .env file has correct values');

module.exports = {
  expectedRedirectUri,
  serverPort
};
