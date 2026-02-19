# Google OAuth Debug Checklist

## Current Error Analysis
The `invalid_grant` error with scope mismatch indicates a configuration issue between your app and Google OAuth.

## Issues Found:
1. **Scope Mismatch**: Requested calendar scopes but received different userinfo scopes
2. **Possible Redirect URI Mismatch**: Server on port 4100 but redirect URI might be port 2000

## Steps to Fix:

### 1. Google Cloud Console Configuration
Go to [Google Cloud Console](https://console.cloud.google.com/):

1. **Enable APIs**:
   - Google Calendar API ✓
   - Google+ API (if required)

2. **OAuth Consent Screen**:
   - Add calendar scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Set user type to "External" for testing
   - Add test users if in testing mode

3. **OAuth 2.0 Client IDs**:
   - Application type: Web application
   - Authorized redirect URIs: 
     - `http://localhost:4100/api/auth/login/google/callback`
     - `https://yourdomain.com/api/auth/login/google/callback` (for production)

### 2. Environment Variables Check
Verify your `.env` file has:
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4100/api/auth/login/google/callback
PORT=4100
```

### 3. Test Steps:

1. **Test Basic Login First**:
   - I've temporarily removed calendar scopes
   - Try login with just profile + email
   - This should work if OAuth is configured correctly

2. **Add Calendar Scopes Gradually**:
   - Once basic login works, add calendar scopes back
   - Ensure Google Console is configured for calendar access

3. **Debug URLs**:
   - Login: `http://localhost:4100/api/auth/login/withGoogle?role=vendor`
   - Callback: `http://localhost:4100/api/auth/login/google/callback`

### 4. Common Fixes:

1. **Redirect URI Mismatch**:
   - Ensure exact match between Google Console and GOOGLE_REDIRECT_URI
   - Include protocol (http/https), port, and path exactly

2. **Scope Issues**:
   - Start with basic scopes first
   - Add calendar scopes only after basic login works
   - Ensure calendar API is enabled in Google Console

3. **App Verification**:
   - For calendar scopes, Google may require app verification
   - During development, add test users to OAuth consent screen

### 5. Test Command:
After making changes, test with:
```bash
curl "http://localhost:4100/api/auth/login/withGoogle?role=vendor"
```

This should redirect to Google OAuth page without errors.
