# EMAIL SERVICE SETUP GUIDE

## Current Status: ❌ NOT WORKING

### Test Results:
- ✅ MongoDB: Working correctly
- ✅ Authentication: Working (with emailVerified bypass)
- ❌ Email Service: **FAILING - ECONNREFUSED 127.0.0.1:465**

### Impact:
- ❌ Email verification emails NOT sent
- ❌ Password reset emails NOT delivered
- ❌ OTP/2FA emails NOT working
- ❌ Support emails NOT functioning
- ❌ Newsletter emails NOT sent
- ❌ All user/vendor/staff email validation BLOCKED

---

## Missing Environment Variables

Add these to **Vercel Dashboard → Settings → Environment Variables**:

```
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password-here
EMAIL_FROM_CONFIG=Gala Tab <noreply@galatab.com>
```

---

## Setup Instructions

### Option 1: Gmail (Recommended)

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Gala Tab Backend"
   - Copy the 16-character password

3. **Add to Vercel**
   ```
   EMAIL_HOST=smtp.gmail.com
   EMAIL_HOST_USER=your-gmail@gmail.com
   EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx (16-char app password)
   EMAIL_FROM_CONFIG=Gala Tab <your-gmail@gmail.com>
   ```

4. **Redeploy**
   - Vercel will automatically redeploy
   - Or manually trigger: `vercel --prod`

### Option 2: SendGrid (Scalable)

1. **Create SendGrid Account**
   - Go to https://sendgrid.com/
   - Free tier: 100 emails/day

2. **Get API Key**
   - Settings → API Keys → Create API Key
   - Choose "Full Access"
   - Copy the key

3. **Configure SMTP**
   ```
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_HOST_USER=apikey
   EMAIL_HOST_PASSWORD=your-sendgrid-api-key
   EMAIL_FROM_CONFIG=Gala Tab <noreply@galatab.com>
   ```

4. **Verify Sender**
   - SendGrid → Settings → Sender Authentication
   - Verify your sending domain or email

### Option 3: AWS SES (Most Reliable)

1. **AWS SES Setup**
   - Go to AWS SES Console
   - Verify your domain or email
   - Request production access (if needed)

2. **Get SMTP Credentials**
   - AWS SES → SMTP Settings
   - Create SMTP Credentials
   - Copy username and password

3. **Configure**
   ```
   EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
   EMAIL_HOST_USER=your-ses-smtp-username
   EMAIL_HOST_PASSWORD=your-ses-smtp-password
   EMAIL_FROM_CONFIG=Gala Tab <noreply@galatab.com>
   ```

---

## Testing After Setup

### 1. Local Test
```bash
node test-email-service.js
```

### 2. Vercel Test
```bash
node test-email-on-vercel.js
```

### 3. Via API (Postman/curl)
```bash
POST https://gt-vs-new-be-code.vercel.app/api/auth/send-otp-email
Content-Type: application/json

{
  "email": "keepingupwiththejonezez@gmail.com"
}
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "OTP sent to the keepingupwiththejonezez@gmail.com",
  "data": {
    "expiresIn": 1707350000000
  }
}
```

---

## Verification Checklist

After configuration:

- [ ] Added EMAIL_HOST to Vercel
- [ ] Added EMAIL_HOST_USER to Vercel
- [ ] Added EMAIL_HOST_PASSWORD to Vercel  
- [ ] Added EMAIL_FROM_CONFIG to Vercel
- [ ] Verified all variables in Production environment
- [ ] Redeployed backend (automatic or manual)
- [ ] Tested email sending via test script
- [ ] Confirmed OTP email received
- [ ] Tested password reset flow
- [ ] Verified welcome emails work

---

## Troubleshooting

### Error: ECONNREFUSED 127.0.0.1:465
**Cause:** EMAIL_HOST not configured or set to localhost  
**Fix:** Set EMAIL_HOST to smtp.gmail.com or your SMTP server

### Error: Authentication failed (535)
**Cause:** Wrong credentials or Gmail blocking less secure apps  
**Fix:** Use App Password (not regular password) for Gmail

### Error: ETIMEDOUT
**Cause:** Firewall blocking port 465 or wrong SMTP server  
**Fix:** Verify EMAIL_HOST and check network connectivity

### Error: Sender address rejected
**Cause:** Unverified sender email  
**Fix:** Verify domain/email with your provider (SendGrid/SES)

---

## Code Location

Email service implementation:
- **Service:** `src/utils/email.js`
- **Routes:** `src/routes/authRoute.js` 
- **Controllers:** `src/controllers/authController.js`
- **Templates:** `/views/email/*.ejs` (if exist)

---

## Current Workaround

For admin account, email verification is bypassed:
```javascript
emailVerified: true
is2FAEnabled: false
```

This allows admin login without email verification, but:
- ❌ Other users CANNOT register (email verification required)
- ❌ Password resets WON'T work
- ❌ 2FA is DISABLED
- ❌ Support emails fail

**ACTION REQUIRED:** Configure email service to enable full functionality.

---

## Priority: 🔴 CRITICAL

Without email service:
- New user registration is BLOCKED
- Password recovery is IMPOSSIBLE  
- Security features (2FA) are DISABLED
- Customer support communication is BROKEN

**Estimated Time:** 15-30 minutes to configure Gmail
**Required:** Email service is MANDATORY for production use
