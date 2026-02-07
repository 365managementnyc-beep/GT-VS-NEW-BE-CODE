# Google Calendar OAuth 2.0 Integration Setup Guide

## Overview
This implementation allows each vendor to connect their personal Google Calendar and manage their events through your platform. Vendors can view, create, update, and delete events in their own Google Calendar.

## Features Added

### 1. OAuth 2.0 Authentication
- Vendors can authorize your app to access their Google Calendar
- Secure token storage with automatic refresh
- Disconnect functionality

### 2. Vendor Calendar Management
- View personal calendar events
- Create new events
- Update existing events
- Delete events
- Schedule meetings with customers

### 3. Security
- Tokens are encrypted and stored securely
- Automatic token refresh when expired
- Role-based access control

## Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Calendar API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
5. Set up OAuth consent screen
6. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:2000/api/calendar/google-auth/callback`

### 2. Environment Variables

Add these to your `.env` file:

```bash
# Google OAuth Settings
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:2000/api/calendar/google-auth/callback

# Google Admin Settings (for admin calendar access)
GOOGLE_ADMIN_EMAIL=admin@yourdomain.com
ADMIN_TIMEZONE=America/New_York
```

### 3. Database Migration

The User model has been updated with Google Calendar OAuth fields. If you're using existing data, you may need to run a migration or the new fields will be added automatically.

## API Endpoints

### OAuth Flow
```
GET /api/calendar/google-auth/url - Get authorization URL
GET /api/calendar/google-auth/callback - Handle OAuth callback
GET /api/calendar/google-auth/status - Check connection status
DELETE /api/calendar/google-auth/disconnect - Disconnect calendar
```

### Vendor Calendar Management
```
GET /api/calendar/vendor/events - Get vendor's calendar events
POST /api/calendar/vendor/events - Create new event
PUT /api/calendar/vendor/events/:eventId - Update event
DELETE /api/calendar/vendor/events/:eventId - Delete event
POST /api/calendar/vendor/schedule-meeting - Schedule meeting with customer
```

### Admin Calendar (Existing)
```
GET /api/calendar/admin/events - Get admin calendar events
POST /api/calendar/admin/schedule-meeting - Schedule admin meeting
```

## Frontend Integration Example

### 1. Connect Google Calendar
```javascript
// Get authorization URL
const response = await fetch('/api/calendar/google-auth/url', {
  headers: { 'Authorization': `Bearer ${userToken}` }
});
const { authUrl } = await response.json();

// Redirect user to Google
window.location.href = authUrl;
```

### 2. Check Connection Status
```javascript
const response = await fetch('/api/calendar/google-auth/status', {
  headers: { 'Authorization': `Bearer ${userToken}` }
});
const { isConnected } = await response.json();
```

### 3. Get Vendor Events
```javascript
const response = await fetch('/api/calendar/vendor/events?maxResults=20', {
  headers: { 'Authorization': `Bearer ${userToken}` }
});
const { events } = await response.json();
```

### 4. Create Event
```javascript
const eventData = {
  summary: "Client Meeting",
  description: "Meeting with client about project",
  startDateTime: "2025-07-20T10:00:00Z",
  endDateTime: "2025-07-20T11:00:00Z",
  timeZone: "America/New_York",
  attendees: ["client@example.com"],
  location: "Office Conference Room"
};

const response = await fetch('/api/calendar/vendor/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify(eventData)
});
```

## Security Considerations

1. **Token Encryption**: OAuth tokens are stored with `select: false` to prevent accidental exposure
2. **Role-based Access**: Only vendors can access vendor calendar endpoints
3. **Token Refresh**: Automatic token refresh prevents expired token issues
4. **HTTPS Required**: Use HTTPS in production for secure token exchange

## Troubleshooting

### Common Issues

1. **"Google Calendar not connected" error**
   - Vendor needs to complete OAuth flow first
   - Check if tokens are properly stored

2. **Token expired errors**
   - The system should auto-refresh, but check refresh token is valid
   - Vendor may need to re-authorize

3. **Quota exceeded**
   - Google Calendar API has rate limits
   - Implement proper error handling and retry logic

### Error Codes

- `CALENDAR_NOT_CONNECTED`: Vendor hasn't connected their Google Calendar
- `INVALID_TOKEN`: OAuth token is invalid or expired
- `QUOTA_EXCEEDED`: API quota exceeded

## Testing

1. Test OAuth flow manually in browser
2. Use Postman to test API endpoints
3. Check token refresh functionality
4. Verify event CRUD operations

## Next Steps

1. Implement frontend UI for calendar management
2. Add event notifications/reminders
3. Implement calendar sync with booking system
4. Add support for multiple calendar accounts per vendor
