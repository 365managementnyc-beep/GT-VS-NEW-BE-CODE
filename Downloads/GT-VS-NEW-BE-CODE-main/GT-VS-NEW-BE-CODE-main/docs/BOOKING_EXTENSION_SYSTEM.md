# Booking Extension System - Complete Guide

## Overview
The booking extension system allows customers, vendors, and admins to extend existing bookings. The system includes a request-approval workflow to ensure both parties agree to the extension.

---

## Extension Request Workflow

### 📋 **Request Flow**

```
Customer Request → Vendor Approval → Booking Extended
Vendor Request → Customer Approval → Booking Extended
Admin Request → Auto-Approved → Booking Extended
```

---

## Role-Based Extension Behavior

### 1️⃣ **Customer Extends Booking**
- **Status:** Creates extension with `request: 'pending'`
- **Payment:** Creates payment intent (requires capture on approval)
- **Notification:** Vendor receives notification about extension request
- **Approval Required:** Yes - Vendor must approve

**Workflow:**
```
1. Customer submits extension request
2. System creates pending extension record
3. System creates payment intent (not captured yet)
4. Vendor receives notification
5. Vendor accepts/rejects via API
6. If accepted: Payment captured, booking updated
7. If rejected: Payment canceled, extension rejected
```

---

### 2️⃣ **Vendor Extends Booking**
- **Status:** Creates extension with `request: 'pending'`
- **Payment:** Creates payment intent (requires capture on approval)
- **Notification:** Customer receives notification about extension request
- **Approval Required:** Yes - Customer must approve

**Workflow:**
```
1. Vendor submits extension request
2. System creates pending extension record
3. System creates payment intent (not captured yet)
4. Customer receives notification
5. Customer accepts/rejects via API
6. If accepted: Payment captured, booking updated
7. If rejected: Payment canceled, extension rejected
```

---

### 3️⃣ **Admin Extends Booking**
- **Status:** Creates extension with `request: 'accept'` (auto-approved)
- **Payment:** Captures payment immediately if succeeded
- **Notification:** Both customer and vendor receive notifications
- **Approval Required:** No - Admin action is final

**Workflow:**
```
1. Admin submits extension request
2. System creates accepted extension record
3. System captures payment immediately
4. Booking updated immediately
5. Both customer and vendor notified
```

---

## API Endpoints

### 1. Create Extension Request
**POST** `/api/booking/extend/:bookingId`

**Request Body:**
```json
{
  "startDate": "2025-10-20T00:00:00Z",
  "endDate": "2025-10-25T00:00:00Z",
  "addOnServices": [
    {
      "service": "service_id",
      "price": 100
    }
  ],
  "timezone": "America/New_York"
}
```

**Authorization:**
- Customer: Can extend their own bookings
- Vendor: Can extend bookings for their services
- Admin: Can extend any booking

**Response:**
```json
{
  "status": "success",
  "message": "Booking extended successfully",
  "data": {
    "extensionBooking": {
      "_id": "extension_id",
      "bookingId": "booking_id",
      "startDate": "2025-10-20T00:00:00Z",
      "endDate": "2025-10-25T00:00:00Z",
      "request": "pending",
      "newChargeAmount": 150,
      "totalAmount": 500,
      "paymentIntentId": "pi_xxx",
      "customerId": "customer_id",
      "vendorId": "vendor_id",
      "servicePrice": [...]
    }
  }
}
```

**Notifications Sent:**

| Requester | Notification To | Title | Message |
|-----------|----------------|-------|---------|
| Customer | Vendor | "Booking Extension Request" | "[Customer Name] has requested to extend their booking until [Date]" |
| Vendor | Customer | "Booking Extension Request from Vendor" | "[Vendor Name] has requested to extend your booking until [Date]" |
| Admin | Customer | "Booking Extension Confirmed by Admin" | "Your booking extension has been confirmed by admin until [Date]" |
| Admin | Vendor | "Booking Extension Confirmed by Admin" | "Booking extension for [Customer Name] has been confirmed by admin until [Date]" |

---

### 2. Accept/Reject Extension Request
**POST** `/api/booking/extension/:extensionId/action`

**Request Body:**
```json
{
  "action": "accept"  // or "reject"
}
```

**Authorization:**
- Vendor: Can accept/reject customer extension requests for their services
- Customer: Can accept/reject vendor extension requests for their bookings
- Admin: Can accept/reject any extension request

**Response (Accept):**
```json
{
  "status": "success",
  "message": "Extension request accepted successfully",
  "data": {
    "extensionRequest": {
      "_id": "extension_id",
      "request": "accept",
      ...
    }
  }
}
```

**Response (Reject):**
```json
{
  "status": "success",
  "message": "Extension request rejected successfully",
  "data": {
    "extensionRequest": {
      "_id": "extension_id",
      "request": "reject",
      ...
    }
  }
}
```

**Notifications Sent:**

| Action | Approver | Notification To | Title | Message |
|--------|----------|----------------|-------|---------|
| Accept | Vendor | Customer | "Booking Extension Accepted" | "Your booking extension request has been accepted by [Vendor Name] until [Date]" |
| Accept | Customer | Vendor | "Booking Extension Accepted" | "[Customer Name] has accepted your booking extension request until [Date]" |
| Reject | Vendor | Customer | "Booking Extension Rejected" | "Your booking extension request has been rejected by [Vendor Name]" |
| Reject | Customer | Vendor | "Booking Extension Rejected" | "[Customer Name] has rejected your booking extension request" |

---

### 3. Get Pending Extension Requests (Vendor)
**GET** `/api/booking/extension/vendor/pending`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Authorization:** Vendor only

**Response:**
```json
{
  "status": "success",
  "data": {
    "extensionRequests": [
      {
        "_id": "extension_id",
        "bookingId": {
          "_id": "booking_id",
          "service": {
            "title": "Wedding Photography",
            ...
          }
        },
        "customerId": {
          "firstName": "John",
          "lastName": "Doe",
          ...
        },
        "startDate": "2025-10-20T00:00:00Z",
        "endDate": "2025-10-25T00:00:00Z",
        "request": "pending",
        "totalAmount": 500,
        "newChargeAmount": 150
      }
    ],
    "total": 5,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### 4. Get Pending Extension Requests (Customer)
**GET** `/api/booking/extension/customer/pending`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Authorization:** Customer only

**Response:**
```json
{
  "status": "success",
  "data": {
    "extensionRequests": [
      {
        "_id": "extension_id",
        "bookingId": {
          "_id": "booking_id",
          "service": {
            "title": "Wedding Venue",
            ...
          }
        },
        "vendorId": {
          "firstName": "Jane",
          "lastName": "Smith",
          ...
        },
        "startDate": "2025-10-20T00:00:00Z",
        "endDate": "2025-10-25T00:00:00Z",
        "request": "pending",
        "totalAmount": 1500,
        "newChargeAmount": 300
      }
    ],
    "total": 2,
    "page": 1,
    "totalPages": 1
  }
}
```

---

### 5. Get Extension Booking Details
**GET** `/api/booking/extension/:extensionId`

**Authorization:** Customer, Vendor, or Admin

**Response:**
```json
{
  "status": "success",
  "data": {
    "extensionBooking": {
      "_id": "extension_id",
      "bookingId": "booking_id",
      "startDate": "2025-10-20T00:00:00Z",
      "endDate": "2025-10-25T00:00:00Z",
      "request": "pending",
      "newChargeAmount": 150,
      "totalAmount": 500,
      "paymentIntentId": "pi_xxx",
      "customerId": "customer_id",
      "vendorId": "vendor_id",
      "servicePrice": [...],
      "createdAt": "2025-10-13T10:00:00Z"
    }
  }
}
```

---

### 6. Get Extension History for Booking
**GET** `/api/booking/:bookingId/extension/history`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Authorization:** Customer, Vendor, or Admin

**Response:**
```json
{
  "status": "success",
  "data": {
    "extensionHistory": [
      {
        "_id": "extension_id",
        "startDate": "2025-10-20T00:00:00Z",
        "endDate": "2025-10-25T00:00:00Z",
        "request": "accept",
        "totalAmount": 500,
        "newChargeAmount": 150,
        "customerId": {
          "firstName": "John",
          "lastName": "Doe"
        },
        "vendorId": {
          "firstName": "Jane",
          "lastName": "Smith"
        },
        "createdAt": "2025-10-13T10:00:00Z"
      }
    ],
    "total": 3,
    "page": 1,
    "totalPages": 1
  }
}
```

---

## Validation Rules

### Extension Request Validation:
1. ✅ **Booking exists** and status is `booked`
2. ✅ **Authorization** - User has permission to extend
3. ✅ **No conflicts** - No overlapping bookings or calendar events
4. ✅ **Future dates** - Start date must be after today
5. ✅ **Valid date range** - End date must be after start date
6. ✅ **Duration increase** - New duration ≥ current duration
7. ✅ **Service availability** - Service not booked/reserved for new dates

### Accept/Reject Validation:
1. ✅ **Extension exists** and status is `pending`
2. ✅ **Authorization** - User has permission to approve/reject
3. ✅ **Valid action** - Action must be 'accept' or 'reject'

---

## Payment Flow

### Customer/Vendor Extension (Pending):
```
1. Create payment intent (not captured)
   - Amount: Additional charge for extension
   - Status: requires_capture

2. On Approval:
   - Capture payment intent
   - Create PayHistory record
   - Update booking dates and price
   - Update extension request status to 'accept'

3. On Rejection:
   - Cancel payment intent
   - Update extension request status to 'reject'
   - No charges applied
```

### Admin Extension (Auto-approved):
```
1. Create payment intent (captures immediately)
   - Amount: Additional charge for extension
   - Status: succeeded

2. If Payment Succeeded:
   - Create PayHistory record immediately
   - Update booking dates and price immediately
   - Extension status set to 'accept'
   - Notify both parties
```

---

## Database Schema

### ExtensionBooking Model:
```javascript
{
  bookingId: ObjectId (ref: 'Booking'),
  startDate: Date,
  endDate: Date,
  request: String ('pending', 'accept', 'reject'),
  newChargeAmount: Number,  // Additional charge
  totalAmount: Number,       // New total booking amount
  paymentIntentId: String,
  amount: Number,            // Same as totalAmount
  vendorId: ObjectId (ref: 'User'),
  customerId: ObjectId (ref: 'User'),
  servicePrice: Array,       // Add-on services
  createdAt: Date,
  updatedAt: Date
}
```

---

## Notification Channels

All extension notifications are sent through:

1. **📱 In-App Notifications** (Socket.IO)
   - Real-time delivery
   - Instant updates

2. **📧 Email Notifications** (if enabled)
   - Based on NotificationPermission settings
   - User email preferences

3. **💬 SMS Notifications** (if enabled)
   - Based on NotificationPermission settings
   - User contact preferences

**Notification Settings:**
- **Type:** `booking`
- **Fortype:** 
  - `booking_extension` (for requests)
  - `booking_extension_accepted` (for approvals)
  - `booking_extension_rejected` (for rejections)
- **Permission:** `bookings`

---

## Example Scenarios

### Scenario 1: Customer Extends Booking
```
1. Customer requests extension
   - POST /api/booking/extend/booking123
   - Status: pending
   → Vendor receives: "John Doe has requested to extend their booking until Oct 25"

2. Vendor approves extension
   - POST /api/booking/extension/ext123/action {action: "accept"}
   - Payment captured
   - Booking updated
   → Customer receives: "Your booking extension request has been accepted by Jane Smith until Oct 25"
```

### Scenario 2: Vendor Extends Booking
```
1. Vendor requests extension
   - POST /api/booking/extend/booking123
   - Status: pending
   → Customer receives: "Jane Smith has requested to extend your booking until Oct 25"

2. Customer approves extension
   - POST /api/booking/extension/ext123/action {action: "accept"}
   - Payment captured
   - Booking updated
   → Vendor receives: "John Doe has accepted your booking extension request until Oct 25"
```

### Scenario 3: Admin Extends Booking
```
1. Admin requests extension
   - POST /api/booking/extend/booking123
   - Status: accept (auto-approved)
   - Payment captured immediately
   - Booking updated immediately
   → Customer receives: "Your booking extension has been confirmed by admin until Oct 25"
   → Vendor receives: "Booking extension for John Doe has been confirmed by admin until Oct 25"
```

### Scenario 4: Extension Rejected
```
1. Customer requests extension
   → Vendor receives notification

2. Vendor rejects extension
   - POST /api/booking/extension/ext123/action {action: "reject"}
   - Payment intent canceled
   - Extension marked as rejected
   → Customer receives: "Your booking extension request has been rejected by Jane Smith"
```

---

## Error Handling

### Common Errors:

| Error | Status | Message |
|-------|--------|---------|
| Booking not found | 404 | "Booking not found" |
| Unauthorized | 403 | "You are not authorized to extend this booking" |
| Conflicting booking | 400 | "This service is already booked for the selected dates" |
| Calendar conflict | 400 | "This service is already booked or reserved for the selected dates" |
| Invalid dates | 400 | "Extension start date must be after today" |
| Invalid date range | 400 | "Extension end date must be after start date" |
| Duration too short | 400 | "Extension duration must be greater or equal to current booking duration" |
| Extension not found | 404 | "Extension request not found" |
| Invalid action | 400 | "Invalid action" |

---

## Testing Checklist

### Customer Extension Flow:
- [ ] Customer can create extension request
- [ ] Vendor receives notification
- [ ] Payment intent created (not captured)
- [ ] Vendor can view pending requests
- [ ] Vendor can accept extension
- [ ] Payment captured on acceptance
- [ ] Booking dates/price updated
- [ ] Customer receives acceptance notification
- [ ] Vendor can reject extension
- [ ] Payment canceled on rejection
- [ ] Customer receives rejection notification

### Vendor Extension Flow:
- [ ] Vendor can create extension request
- [ ] Customer receives notification
- [ ] Payment intent created (not captured)
- [ ] Customer can view pending requests
- [ ] Customer can accept extension
- [ ] Payment captured on acceptance
- [ ] Booking dates/price updated
- [ ] Vendor receives acceptance notification
- [ ] Customer can reject extension
- [ ] Payment canceled on rejection
- [ ] Vendor receives rejection notification

### Admin Extension Flow:
- [ ] Admin can create extension request
- [ ] Extension auto-approved
- [ ] Payment captured immediately
- [ ] Booking updated immediately
- [ ] Customer receives notification
- [ ] Vendor receives notification

### Validation Tests:
- [ ] Cannot extend non-existent booking
- [ ] Cannot extend non-booked status
- [ ] Unauthorized users blocked
- [ ] Conflicting bookings detected
- [ ] Calendar conflicts detected
- [ ] Past dates rejected
- [ ] Invalid date ranges rejected
- [ ] Duration decrease rejected

---

## Benefits

✅ **Two-Way Approval** - Both parties must agree to extensions

✅ **Fair Process** - Vendor and customer requests treated equally

✅ **Payment Security** - Payment captured only after approval

✅ **Real-time Notifications** - All parties stay informed

✅ **Admin Override** - Admin can directly approve extensions

✅ **Audit Trail** - Complete extension history tracked

✅ **Conflict Prevention** - Validates availability before allowing extension

✅ **Flexible Pricing** - Supports add-on services in extensions

---

**Implementation Date:** October 13, 2025  
**Status:** ✅ Complete and Ready for Testing
