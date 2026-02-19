# Unified Google OAuth Webhook for Login + Calendar

## Overview
Your system now uses a **single Google OAuth webhook** for both user authentication AND calendar connection. Both flows use the same callback URL but are handled differently based on the request type.

## Unified Webhook Architecture

### Single Callback URL
- **URL**: `/api/auth/login/google/callback`
- **Used for**: Both login and calendar-only connections
- **Detection**: System automatically detects the request type using session flags

### How It Works

#### Login Flow:
1. User clicks "Sign in with Google"
2. Redirects to Google with login scopes
3. Google redirects to `/api/auth/login/google/callback`
4. System detects this is a login (no `isCalendarOnly` flag)
5. Passport handles authentication + calendar connection
6. User is logged in with calendar auto-connected

#### Calendar-Only Flow:
1. Logged-in user wants to connect calendar manually
2. Calls `/api/calendar/google-auth/url`
3. System sets `isCalendarOnly = true` in session
4. Redirects to Google with calendar scopes
5. Google redirects to `/api/auth/login/google/callback` (same URL!)
6. System detects `isCalendarOnly = true`
7. Handles as calendar-only connection
8. Redirects to frontend calendar page

## Configuration

### Environment Variables
```bash
# Single callback URL for both flows
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:2000/api/auth/login/google/callback

# Frontend URLs for redirects
FRONTEND_URL=http://localhost:4000
```

### Google Cloud Console Setup
1. Go to Google Cloud Console
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Set **Authorized redirect URI**: `http://localhost:2000/api/auth/login/google/callback`
5. **Important**: Only one callback URL needed for both flows!

### 2. What Happens During Login

#### For New Users:
- User account created with Google info
- Calendar tokens stored automatically
- `googleCalendar.isConnected = true`
- User can immediately use calendar features

#### For Existing Users:
- Login with existing account
- Calendar tokens updated if not already connected
- If already connected, tokens are refreshed

### 3. Calendar Features Available

After Google login, vendors can immediately:
- View their calendar events: `GET /api/calendar/vendor/events`
- Create new events: `POST /api/calendar/vendor/events`
- Update events: `PUT /api/calendar/vendor/events/:eventId`
- Delete events: `DELETE /api/calendar/vendor/events/:eventId`
- Schedule meetings: `POST /api/calendar/vendor/schedule-meeting`

## API Endpoints

### Authentication (Login with Calendar Auto-Connect)
```
GET /api/auth/login/withGoogle?role=vendor - Login with Google + auto-connect calendar
GET /api/auth/login/google/callback - Unified callback for both login and calendar
```

### Calendar-Only Connection (For existing users)
```
GET /api/calendar/google-auth/url - Get URL for calendar-only connection
# Callback uses same URL: /api/auth/login/google/callback
```

### Calendar Status & Management
```
GET /api/calendar/google-auth/status - Check connection status
GET /api/calendar/google-auth/check-auto-connected - Check if auto-connected
DELETE /api/calendar/google-auth/disconnect - Disconnect calendar

GET /api/calendar/vendor/events - Get vendor's events
POST /api/calendar/vendor/events - Create new event
PUT /api/calendar/vendor/events/:eventId - Update event
DELETE /api/calendar/vendor/events/:eventId - Delete event
POST /api/calendar/vendor/schedule-meeting - Schedule customer meeting
```

## Benefits of Unified Webhook

### ✅ **Simplified Setup**
- Only one callback URL to configure in Google Console
- No confusion about which URL to use
- Easier to manage and maintain

### ✅ **Consistent Behavior**
- Same OAuth flow for both scenarios
- Same error handling
- Same security measures

### ✅ **Automatic Detection**
- System automatically knows if it's login or calendar-only
- No need for different endpoints
- Seamless user experience

### ✅ **Easier Frontend Integration**
```javascript
// Both flows use the same callback URL
const GOOGLE_CALLBACK = '/api/auth/login/google/callback'

// Login with calendar auto-connect
window.location.href = '/api/auth/login/withGoogle?role=vendor'

// Manual calendar connection (same callback!)
window.location.href = calendarAuthUrl // Points to same callback
```

## Frontend Integration

### 1. Google Login with Calendar
```javascript
// Redirect to Google login (calendar will be auto-connected)
window.location.href = '/api/auth/login/withGoogle?role=vendor';
```

### 2. Check Calendar Status After Login
```javascript
// Check if calendar was auto-connected
const response = await fetch('/api/calendar/google-auth/check-auto-connected', {
  headers: { 'Authorization': `Bearer ${userToken}` }
});

const { isGoogleUser, isCalendarConnected } = await response.json();

if (isGoogleUser && isCalendarConnected) {
  console.log('Calendar auto-connected during login!');
  // Show calendar features immediately
} else if (isGoogleUser && !isCalendarConnected) {
  console.log('Google user but calendar not connected');
  // Offer manual connection option
} else {
  console.log('Not a Google user');
  // Show regular login options
}
```

### 3. Using Calendar Features
```javascript
// Get vendor's calendar events
const events = await fetch('/api/calendar/vendor/events', {
  headers: { 'Authorization': `Bearer ${userToken}` }
});

// Create a new event
const newEvent = await fetch('/api/calendar/vendor/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    summary: "Client Meeting",
    startDateTime: "2025-07-20T10:00:00Z",
    endDateTime: "2025-07-20T11:00:00Z",
    timeZone: "UTC"
  })
});
```

## Benefits of This Approach

### ✅ **Seamless Experience**
- One-click login + calendar connection
- No separate OAuth flows
- Users don't need to understand the difference

### ✅ **Automatic Setup**
- Calendar ready immediately after login
- No additional setup steps
- Works for both new and existing users

### ✅ **Fallback Options**
- Manual connection still available if needed
- Status checking endpoints
- Graceful handling of connection issues

### ✅ **Security**
- Single OAuth flow reduces complexity
- Proper token management
- Automatic token refresh

## Error Handling

### Common Scenarios

1. **User denies calendar permission**
   - Login still works
   - Calendar features disabled
   - Can manually connect later

2. **Token refresh fails**
   - Automatic retry with refresh token
   - Graceful degradation if fails
   - User can re-authorize

3. **User already connected**
   - Tokens updated if needed
   - No duplicate connections
   - Seamless experience

## Testing

### 1. Test New User Flow
1. Use Google login with a new email
2. Check that user is created
3. Verify calendar is auto-connected
4. Test calendar features

### 2. Test Existing User Flow
1. Use Google login with existing user
2. Verify login works
3. Check calendar connection status
4. Test calendar operations

### 3. Test Manual Connection
1. Use existing user without calendar
2. Call manual connection endpoint
3. Verify separate OAuth flow works
4. Test calendar features

## Migration for Existing Users

Existing users who signed up with Google before this update:
1. Will have their calendar auto-connected on next login
2. Can use manual connection endpoint if needed
3. All existing functionality preserved

This unified approach provides the best user experience while maintaining all the flexibility and security of separate OAuth flows when needed.
