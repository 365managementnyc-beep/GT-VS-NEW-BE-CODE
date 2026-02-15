# 🚨 EMAIL SERVICE QUICK FIX

## Current Status: ❌ NOT WORKING

Your email service is using placeholder values. Follow these steps to fix it NOW.

---

## OPTION 1: Gmail (Fastest - 5 minutes)

### Step 1: Generate Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Go to: https://myaccount.google.com/apppasswords
4. Create App Password:
   - Select App: **Mail**
   - Select Device: **Other** (name it "Gala Tab")
   - Click **Generate**
   - Copy the 16-character password (format: xxxx xxxx xxxx xxxx)

### Step 2: Update Local .env File

Open: `c:\Users\muzik\Desktop\GT-Dev-Backend-main\.env`

Replace these lines:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=YOUR_GMAIL_ADDRESS@gmail.com
EMAIL_HOST_PASSWORD=your_16_char_app_password_here
EMAIL_FROM_CONFIG=Gala Tab <YOUR_GMAIL_ADDRESS@gmail.com>
```

Example:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=keepingupwiththejonezez@gmail.com
EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM_CONFIG=Gala Tab <keepingupwiththejonezez@gmail.com>
```

### Step 3: Test Locally

```powershell
cd "c:\Users\muzik\Desktop\GT-Dev-Backend-main"
node test-email-service.js
```

You should see: **✅ EMAIL SENT SUCCESSFULLY!**

### Step 4: Update Vercel Environment Variables

1. Go to: https://vercel.com/dashboard
2. Select your backend project: **gt-vs-new-be-code**
3. Go to: **Settings** → **Environment Variables**
4. Add/Update these variables (for **Production** environment):

   ```
   EMAIL_HOST = smtp.gmail.com
   EMAIL_HOST_USER = YOUR_GMAIL_ADDRESS@gmail.com
   EMAIL_HOST_PASSWORD = your_16_char_app_password
   EMAIL_FROM_CONFIG = Gala Tab <YOUR_GMAIL_ADDRESS@gmail.com>
   ```

5. Click **Save**

### Step 5: Redeploy Backend

Vercel auto-redeploys when you save env variables, OR manually trigger:

```powershell
cd "c:\Users\muzik\Desktop\GT-Dev-Backend-main"
vercel --prod
```

### Step 6: Test Production

```powershell
cd "c:\Users\muzik\Desktop\GT-Dev-Backend-main"
.\test-email-final.ps1
```

OR

```powershell
node test-email-on-vercel.js
```

---

## OPTION 2: SendGrid (Better for Production)

### Why SendGrid?
- ✅ Free tier: 100 emails/day
- ✅ Better deliverability
- ✅ Professional email tracking
- ✅ No Gmail sending limits

### Setup:

1. **Create Account**: https://sendgrid.com/
2. **Verify Email**: Check your inbox for verification
3. **Create API Key**:
   - Settings → API Keys
   - Create API Key (Full Access)
   - Copy the key (starts with SG.)
4. **Verify Sender**:
   - Settings → Sender Authentication
   - Single Sender Verification
   - Add your email and verify it

### Update .env:
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM_CONFIG=Gala Tab <your-verified-email@domain.com>
```

### Update Vercel (same as Gmail Step 4 above)

---

## Testing Checklist

After setup, test these:

### 1. Test Email Service
```bash
node test-email-service.js
```
Expected: ✅ EMAIL SENT SUCCESSFULLY!

### 2. Test Production Backend
```bash
node test-email-on-vercel.js
```
Expected: ✅ Email service appears to be working!

### 3. Test OTP Email via Login
- Go to your frontend login page
- Try to register a new user
- Check if OTP email arrives

### 4. Test Password Reset
- Click "Forgot Password"
- Enter email
- Check if reset email arrives

---

## Common Issues

### ❌ "Authentication failed (535)"
- **Gmail**: You used regular password instead of App Password
- **Fix**: Create App Password (Step 1 above)

### ❌ "ECONNREFUSED"
- **Cause**: EMAIL_HOST not set correctly
- **Fix**: Use `smtp.gmail.com` for Gmail

### ❌ "Sender address rejected"
- **SendGrid**: Email not verified
- **Fix**: Verify sender in SendGrid dashboard

### ❌ Email goes to spam
- **Gmail**: Use your real Gmail address
- **SendGrid**: Set up domain authentication (SPF/DKIM)

---

## After Email Setup Works

Your users will be able to:
- ✅ Complete registration with email verification
- ✅ Receive OTP codes for 2FA
- ✅ Reset forgotten passwords
- ✅ Get booking confirmations
- ✅ Receive notifications

---

## Need Help?

Run the test script and send me the output:
```powershell
cd "c:\Users\muzik\Desktop\GT-Dev-Backend-main"
node test-email-service.js
```
