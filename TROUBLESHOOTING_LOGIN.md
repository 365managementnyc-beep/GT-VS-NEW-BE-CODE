# Login Troubleshooting Guide

## Common Login Issues When Accessing from Another Computer

### 1. **Check the Error Message**
The login can fail for several reasons. Check what error you're getting:

#### Account Status Issues:
- ❌ **"Account is under review by Admin"** → Status: Pending
- ❌ **"Account is rejected by Admin"** → Status: Rejected  
- ❌ **"Account deleted by Admin"** → Status: Delete
- ❌ **"Account Suspend by Admin"** → Status: Suspend/Inactive

#### Credential Issues:
- ❌ **"Invalid Credentials"** → Wrong email or password
- ❌ **"This account uses social login"** → Account created with Google/Facebook

#### Verification Issues:
- ℹ️ **"2FA is enabled. Please verify your identity"** → Need to enter OTP
- ℹ️ **"Please verify your email to proceed"** → Email not verified

### 2. **Frontend Configuration Check**

Make sure you're using the correct environment file:

**For Local Development** (`.env.local`):
```env
VITE_BACKEND_BASE_URL=https://gt-vs-new-be-code-5p4x2who0-qs-projects-10333adc.vercel.app/api
```

**For Production** (`.env.production`):
```env
VITE_BACKEND_BASE_URL=https://gt-vs-new-be-code.vercel.app/api
```

### 3. **Browser Issues**

When logging in from another computer:

1. **Clear Browser Cache & Cookies**
   - Sometimes old tokens or cookies can cause issues
   - Clear specifically for your frontend domain

2. **Check Local Storage**
   - Open DevTools (F12)
   - Go to Application → Local Storage
   - Check if there's an old `token` stored
   - Clear it: `localStorage.removeItem('token')`

3. **Check Console for Errors**
   - Open DevTools (F12) → Console tab
   - Look for any red errors during login
   - Check Network tab for failed requests

### 4. **Network/CORS Issues**

The backend CORS is configured to allow all origins, but check:

1. **Network Request in DevTools**:
   - Open DevTools → Network tab
   - Try to login
   - Look for the `/api/auth/login` request
   - Check if it's showing 401, 403, 404, or 500 errors
   - Look at the Response tab for detailed error

2. **Firewall/VPN**:
   - Corporate firewalls might block certain requests
   - Try disabling VPN temporarily
   - Try from a different network

### 5. **Backend Health Check**

Test if the backend is accessible:

```bash
# In browser or curl
https://gt-vs-new-be-code.vercel.app/api/health
```

Should return:
```json
{
  "status": "success",
  "message": "API is healthy"
}
```

### 6. **Test Login from Command Line**

#### Using Node.js:
```bash
cd "c:\Users\muzik\Desktop\GT-Dev-Backend-main"
node test-login-debug.js
```

#### Using PowerShell:
```powershell
cd "c:\Users\muzik\Desktop\GT-Dev-Backend-main"
.\test-login.ps1
```

### 7. **Account-Specific Checks**

Run this in MongoDB or through your admin panel:

```javascript
// Check user account status
db.users.findOne({ email: "your-email@example.com" }, {
  status: 1,
  emailVerified: 1,
  is2FAEnabled: 1,
  role: 1,
  password: 1  // Should exist if not using social login
})
```

### 8. **JWT Token Issues**

If login succeeds but subsequent requests fail:

1. **Token Not Being Saved**:
   ```javascript
   // Check after login in browser console
   localStorage.getItem('token')
   ```

2. **Token Not Being Sent**:
   - Check Network tab → Request Headers
   - Should have: `Authorization: Bearer <token>`

3. **Token Expiry**:
   - Current setting: 90 days (JWT_EXPIRES_IN=90d)
   - Check if token is expired

### 9. **2FA/Email Verification Flow**

If user has 2FA enabled or email not verified:

1. Login request will return:
   ```json
   {
     "status": "success",
     "message": "2FA is enabled. Please verify your identity.",
     "data": {
       "userId": "...",
       "email": "...",
       "is2FAEnabled": true
     }
   }
   ```

2. Frontend should redirect to `/auth/welcome/email-verification`
3. User enters OTP sent to email
4. After OTP verification, token is issued

### 10. **Quick Diagnostic Steps**

Run these in order:

1. ✅ **Test Backend**: Visit `https://gt-vs-new-be-code.vercel.app/api/health`
2. ✅ **Check Environment**: Verify `VITE_BACKEND_BASE_URL` in your `.env` file
3. ✅ **Clear Browser Data**: Clear cache, cookies, local storage
4. ✅ **Test Credentials**: Try test-login-debug.js with your credentials
5. ✅ **Check Console**: Look for errors in DevTools Console
6. ✅ **Check Network**: Look for failed requests in DevTools Network tab
7. ✅ **Verify Account**: Check user status in database

## Common Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Validation failed | Check email/password format |
| 401 | Invalid credentials | Verify email and password are correct |
| 404 | Account issue | Check account status (pending/rejected/deleted) |
| 429 | Too many attempts | Wait 24 hours or contact admin |
| 500 | Server error | Check backend logs |

## Still Having Issues?

1. Run the debug script with your credentials:
   - Edit `test-login-debug.js` with your email/password
   - Run: `node test-login-debug.js`
   - Send the complete output

2. Provide these details:
   - Exact error message from browser
   - Browser console logs (DevTools → Console)
   - Network request details (DevTools → Network)
   - Which computer/network you're using
   - Whether it works on the original computer
