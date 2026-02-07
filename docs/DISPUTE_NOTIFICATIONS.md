# Dispute Notification System

## Overview
The dispute module now includes automatic notifications for both admins and users (customers/vendors) at key stages of the dispute lifecycle.

---

## Notification Flow

### 1️⃣ **When Dispute is Created**
**Trigger:** Customer or Vendor creates a new dispute

**Notification Sent To:** Admin

**Details:**
- **Title:** "New Dispute Created"
- **Message:** "[User Name] ([customer/vendor]) has created a dispute for [Service Name]"
- **Type:** booking
- **Permission:** disputes

**Example:**
```
Title: New Dispute Created
Message: John Doe (customer) has created a dispute for Wedding Photography Service
```

---

### 2️⃣ **When Dispute Status is Updated by Admin**
**Trigger:** Admin updates dispute status

**Notification Sent To:** Dispute Creator (Customer or Vendor who created the dispute)

**Status-Specific Messages:**

#### Status: Review
- **Title:** "Dispute Review"
- **Message:** "Your dispute for [Service Name] is now under review by admin"

#### Status: Accept
- **Title:** "Dispute Accept"
- **Message:** "Your dispute for [Service Name] has been accepted by admin"

#### Status: Reject
- **Title:** "Dispute Reject"
- **Message:** "Your dispute for [Service Name] has been rejected by admin"

#### Status: Other
- **Title:** "Dispute [Status]"
- **Message:** "Your dispute status for [Service Name] has been updated to [Status]"

---

## API Endpoints

### Create Dispute
**POST** `/api/dispute`

**Request Body:**
```json
{
  "description": "Service was not delivered as promised",
  "property": "booking_id_here",
  "status": "Pending"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Dispute created Successfully",
  "dispute": {
    "_id": "dispute_id",
    "description": "Service was not delivered as promised",
    "property": "booking_id",
    "disputeBy": "user_id",
    "disputeRole": "customer",
    "status": "Pending"
  }
}
```

**Notification Triggered:**
✅ Admin receives notification about new dispute

---

### Update Dispute Status (Admin Only)
**PATCH** `/api/dispute/status/:id`

**Request Body:**
```json
{
  "status": "Accept"
}
```

**Available Statuses:**
- `Pending` - Initial status
- `Review` - Admin is reviewing
- `Accept` - Dispute accepted
- `Reject` - Dispute rejected

**Response:**
```json
{
  "status": "success",
  "message": "Status update Successfully",
  "dispute": {
    "_id": "dispute_id",
    "status": "Accept",
    ...
  }
}
```

**Notification Triggered:**
✅ Dispute creator (customer/vendor) receives notification about status change

---

## Notification Channels

The notifications are sent through the existing notification system which supports:

1. **📱 In-App Notifications** (Socket.IO)
   - Real-time notifications in the app
   - Delivered instantly to connected users

2. **📧 Email Notifications** (if enabled)
   - Based on NotificationPermission settings
   - Admin and user email preferences

3. **💬 SMS Notifications** (if enabled)
   - Based on NotificationPermission settings
   - User contact number required

---

## Implementation Details

### Files Modified:
- `src/controllers/disputeController.js`

### Dependencies Added:
```javascript
const User = require('../models/users/User');
const Booking = require('../models/Bookings');
const sendNotification = require('../utils/storeNotification');
```

### Functions Updated:

#### 1. `createDispute`
- Finds admin user
- Sends notification to admin with dispute details
- Includes service name and user information

#### 2. `updateStatus`
- Fetches dispute with populated user details
- Determines appropriate message based on status
- Sends notification to dispute creator
- Includes service name and status information

---

## Notification Settings

The notifications respect the `NotificationPermission` model settings:

**Permission Type:** `venue_cancellation`

**Can be controlled via:**
- Admin notification settings
- User notification preferences
- Email/SMS/Mobile notification toggles

---

## Example Scenarios

### Scenario 1: Customer Creates Dispute
```
1. Customer creates dispute for a booking
   → Admin receives: "John Doe (customer) has created a dispute for Wedding Photography"

2. Admin updates status to "Review"
   → Customer receives: "Your dispute for Wedding Photography is now under review by admin"

3. Admin updates status to "Accept"
   → Customer receives: "Your dispute for Wedding Photography has been accepted by admin"
```

### Scenario 2: Vendor Creates Dispute
```
1. Vendor creates dispute for a booking
   → Admin receives: "Jane Smith (vendor) has created a dispute for Birthday Party Venue"

2. Admin updates status to "Reject"
   → Vendor receives: "Your dispute for Birthday Party Venue has been rejected by admin"
```

---

## Benefits

✅ **Real-time Updates** - Users are instantly notified of dispute status changes

✅ **Admin Awareness** - Admins are immediately alerted to new disputes

✅ **Transparency** - Both parties stay informed throughout the process

✅ **Better UX** - Users don't need to constantly check for updates

✅ **Audit Trail** - All notifications are stored in the database

---

## Testing

### Test Create Dispute Notification:
```bash
POST /api/dispute
Authorization: Bearer <customer_or_vendor_token>

Body:
{
  "description": "Test dispute",
  "property": "booking_id",
  "status": "Pending"
}

Expected: Admin receives notification
```

### Test Status Update Notification:
```bash
PATCH /api/dispute/status/dispute_id
Authorization: Bearer <admin_token>

Body:
{
  "status": "Accept"
}

Expected: Dispute creator receives notification
```

---

## Troubleshooting

### Notification Not Received?

1. **Check User Socket Connection**
   - Ensure user is connected to Socket.IO
   - Check notification room subscription

2. **Check Notification Permissions**
   - Verify NotificationPermission settings for 'venue_cancellation' type
   - Check if mobile notifications are enabled

3. **Check Database**
   - Verify notification was saved in Notification collection
   - Check if notification has `isDelivered: true`

4. **Check User Details**
   - Ensure dispute has valid `disputeBy` user
   - Ensure booking has valid service reference
   - Verify admin user exists in database

---

## Future Enhancements

Possible future improvements:

- [ ] Notify both customer and vendor on status update
- [ ] Add dispute comment notifications
- [ ] Notify when dispute is resolved/closed
- [ ] Add escalation notifications for pending disputes
- [ ] Email digest for unresolved disputes
- [ ] Notification preferences per dispute type

---

## Status Reference

| Status | Description | Who Can Set | Notification |
|--------|-------------|-------------|--------------|
| **Pending** | Initial state | System (on create) | Admin notified |
| **Review** | Under admin review | Admin only | User notified |
| **Accept** | Dispute accepted | Admin only | User notified |
| **Reject** | Dispute rejected | Admin only | User notified |

---

**Implementation Date:** October 13, 2025  
**Status:** ✅ Complete and Tested
