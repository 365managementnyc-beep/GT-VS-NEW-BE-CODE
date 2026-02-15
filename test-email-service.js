require('dotenv').config();
const Email = require('./src/utils/email');

console.log('===========================================');
console.log('EMAIL SERVICE CONFIGURATION CHECK');
console.log('===========================================\n');

// Check environment variables
const emailConfig = {
  EMAIL_HOST: process.env.EMAIL_HOST || 'NOT SET',
  EMAIL_HOST_USER: process.env.EMAIL_HOST_USER || 'NOT SET',
  EMAIL_HOST_PASSWORD: process.env.EMAIL_HOST_PASSWORD ? '✓ SET (hidden)' : 'NOT SET',
  EMAIL_FROM_CONFIG: process.env.EMAIL_FROM_CONFIG || 'NOT SET',
};

console.log('📧 Email Configuration:');
console.log('─────────────────────────────────────────');
Object.entries(emailConfig).forEach(([key, value]) => {
  const status = value === 'NOT SET' ? '❌' : '✅';
  console.log(`${status} ${key}: ${value}`);
});
console.log('\n');

// Test email sending
async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');
  
  if (emailConfig.EMAIL_HOST === 'NOT SET' || emailConfig.EMAIL_HOST_USER === 'NOT SET') {
    console.log('❌ EMAIL SERVICE NOT CONFIGURED');
    console.log('\nRequired environment variables:');
    console.log('  - EMAIL_HOST (e.g., smtp.gmail.com)');
    console.log('  - EMAIL_HOST_USER (your email address)');
    console.log('  - EMAIL_HOST_PASSWORD (app password)');
    console.log('  - EMAIL_FROM_CONFIG (sender name/email)\n');
    console.log('For Gmail:');
    console.log('1. Enable 2FA on your Google account');
    console.log('2. Generate App Password: https://myaccount.google.com/apppasswords');
    console.log('3. Use smtp.gmail.com as EMAIL_HOST');
    console.log('4. Add these to Vercel Environment Variables\n');
    return;
  }

  try {
    console.log('Attempting to send test email...');
    console.log(`From: ${emailConfig.EMAIL_FROM_CONFIG}`);
    console.log(`To: ${emailConfig.EMAIL_HOST_USER}`);
    console.log('Subject: Test Email from Gala Tab Backend\n');
    
    const emailService = new Email(
      process.env.EMAIL_HOST_USER,
      'Test User',
      null
    );
    
    await emailService.sendTextEmail(
      'Test Email - Gala Tab Backend',
      'This is a test email to verify email service is working correctly. If you receive this, email service is operational!',
      {}
    );
    
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('\n✓ Email service is working correctly');
    console.log('✓ OTP emails will be delivered');
    console.log('✓ Password reset emails will work');
    console.log('✓ Verification emails will be sent\n');
    
  } catch (error) {
    console.log('❌ EMAIL SEND FAILED!');
    console.log('\nError Details:');
    console.log('  Code:', error.code || 'Unknown');
    console.log('  Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  SMTP Connection Refused');
      console.log('  - Check EMAIL_HOST is correct (e.g., smtp.gmail.com)');
      console.log('  - Verify port 465 is not blocked');
      console.log('  - Check firewall settings');
    } else if (error.responseCode === 535) {
      console.log('\n⚠️  Authentication Failed');
      console.log('  - Verify EMAIL_HOST_USER and EMAIL_HOST_PASSWORD are correct');
      console.log('  - For Gmail, use App Password (not regular password)');
      console.log('  - Enable "Less secure app access" if needed');
    } else if (error.code === 'EDNS' || error.code === 'ENOTFOUND') {
      console.log('\n⚠️  Cannot Resolve Host');
      console.log('  - Check EMAIL_HOST value');
      console.log('  - Verify internet connectivity');
    }
    console.log('\n');
  }
}

console.log('===========================================');
testEmailService().then(() => {
  console.log('===========================================');
  process.exit(0);
}).catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
