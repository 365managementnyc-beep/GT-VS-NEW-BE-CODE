# 🚀 Quick Reference - Booking Extension Updates

## 📝 Summary
Vendor extension requests now require **customer approval** (previously auto-approved).

---

## 🔄 What Changed?

| Role | Old Behavior | New Behavior |
|------|-------------|--------------|
| **Customer** | Creates pending request → Vendor approves | ✅ Same (no change) |
| **Vendor** | ❌ Auto-approved | ✅ Creates pending request → Customer approves |
| **Admin** | ✅ Auto-approved | ✅ Same (no change) |

---

## 📋 New Functions Added

### `extensionsRequestForCustomer`
**Purpose:** Get pending extension requests for customer (from vendors)  
**Route:** `GET /api/booking/extension/customer/pending`  
**Auth:** Customer only

```javascript
// Example Response
{
  "status": "success",
  "data": {
    "extensionRequests": [
      {
        "_id": "ext123",
        "vendorId": { "firstName": "Jane", "lastName": "Smith" },
        "startDate": "2025-10-20",
        "endDate": "2025-10-25",
        "totalAmount": 500,
        "newChargeAmount": 150
      }
    ],
    "total": 2,
    "page": 1,
    "totalPages": 1
  }
}
```

---

## 🔔 New Notifications

### Vendor Requests Extension:
```
TO: Customer
TITLE: "Booking Extension Request from Vendor"
MESSAGE: "Jane Smith has requested to extend your booking until Oct 25"
```

### Customer Approves Vendor's Request:
```
TO: Vendor
TITLE: "Booking Extension Accepted"
MESSAGE: "John Doe has accepted your booking extension request until Oct 25"
```

### Customer Rejects Vendor's Request:
```
TO: Vendor
TITLE: "Booking Extension Rejected"
MESSAGE: "John Doe has rejected your booking extension request"
```

---

## 🛠️ Modified Functions

### 1. `extendBooking`
- ✅ Separated vendor and admin logic
- ✅ Vendor requests now create `pending` status
- ✅ Vendor requests notify customer (not vendor)

### 2. `acceptorRejectExtension`
- ✅ Added authorization checks for vendor and customer
- ✅ Added role-based notification logic
- ✅ Added rejection notifications
- ✅ Populated customer and vendor details

### 3. `extensionsRequestForVendor`
- ✅ Added `.sort({ createdAt: -1 })` for newest first

---

## 🧪 Quick Test Commands

### 1. Vendor Creates Extension Request:
```bash
POST /api/booking/extend/:bookingId
Authorization: Bearer <vendor_token>

{
  "startDate": "2025-10-20T00:00:00Z",
  "endDate": "2025-10-25T00:00:00Z",
  "timezone": "America/New_York"
}

# Expected: request: "pending"
# Expected: Customer gets notification
```

### 2. Customer Views Pending Requests:
```bash
GET /api/booking/extension/customer/pending
Authorization: Bearer <customer_token>

# Expected: Shows vendor's extension request
```

### 3. Customer Approves:
```bash
POST /api/booking/extension/:extensionId/action
Authorization: Bearer <customer_token>

{
  "action": "accept"
}

# Expected: Payment captured
# Expected: Booking updated
# Expected: Vendor gets notification
```

### 4. Customer Rejects:
```bash
POST /api/booking/extension/:extensionId/action
Authorization: Bearer <customer_token>

{
  "action": "reject"
}

# Expected: Payment canceled
# Expected: Vendor gets notification
```

---

## 📦 Exports Updated

```javascript
module.exports = {
  // ... existing exports
  extensionsRequestForCustomer,  // ✅ NEW
};
```

---

## ⚠️ Important Notes

1. **Breaking Change:** Vendor extensions no longer auto-approved
2. **Route Required:** Add `extensionsRequestForCustomer` to routes
3. **Frontend Update:** Add customer approval UI for vendor requests
4. **Payment:** Only captured after both parties approve
5. **Admin:** Still has override power (auto-approves)

---

## 🎯 Benefits

- ✅ Fair approval process for both parties
- ✅ Customer control over their bookings
- ✅ Better transparency and communication
- ✅ Payment protection until approval
- ✅ Complete audit trail

---

## 📄 Full Documentation

See detailed docs:
- `docs/BOOKING_EXTENSION_SYSTEM.md` - Complete API guide
- `docs/BOOKING_EXTENSION_CHANGES.md` - Implementation details

---

**Updated:** October 13, 2025  
**Status:** ✅ Ready for Testing
