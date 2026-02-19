# Booking Extension System - Implementation Summary

## 🎯 What Changed?

Previously, when a vendor extended a booking, it was **automatically approved**. Now, vendor extension requests require **customer approval**, just like customer requests require vendor approval.

---

## ✅ Changes Made

### 1. **Modified `extendBooking` Function**
**File:** `src/controllers/requestController.js`

#### Before:
```javascript
if (req.user.role === 'vendor' || req.user.role === 'admin') {
  // Extension auto-approved for both vendor and admin
  extensionBooking = await Extensionbooking.create({
    request: 'accept',  // ❌ Auto-approved
    ...
  });
}
```

#### After:
```javascript
if (req.user.role === 'customer') {
  // Customer creates pending request → Vendor approves
  extensionBooking = await Extensionbooking.create({
    request: 'pending',
    ...
  });
  // Notify vendor
}

if (req.user.role === 'vendor') {
  // Vendor creates pending request → Customer approves
  extensionBooking = await Extensionbooking.create({
    request: 'pending',  // ✅ Now requires approval
    ...
  });
  // Notify customer
}

if (req.user.role === 'admin') {
  // Admin still auto-approves
  extensionBooking = await Extensionbooking.create({
    request: 'accept',
    ...
  });
  // Notify both customer and vendor
}
```

---

### 2. **Enhanced `acceptorRejectExtension` Function**
**File:** `src/controllers/requestController.js`

#### New Features:
- ✅ **Authorization checks** - Ensures only authorized users can approve/reject
- ✅ **Role-based notifications** - Different messages for vendor vs customer approvals
- ✅ **Rejection notifications** - Users notified when extensions are rejected
- ✅ **Populated data** - Includes customer and vendor details for better notifications

#### Changes:
```javascript
// Added authorization checks
if (req.user.role === 'vendor' && extensionRequest.vendorId._id.toString() !== req.user._id.toString()) {
  return next(new AppError('You are not authorized to manage this extension request', 403));
}
if (req.user.role === 'customer' && extensionRequest.customerId._id.toString() !== req.user._id.toString()) {
  return next(new AppError('You are not authorized to manage this extension request', 403));
}

// Added role-based notifications for accept
if (req.user.role === 'vendor') {
  // Vendor approved customer's request
  sendNotification({ ... });
} else if (req.user.role === 'customer') {
  // Customer approved vendor's request
  sendNotification({ ... });
}

// Added role-based notifications for reject
if (req.user.role === 'vendor') {
  // Vendor rejected customer's request
  sendNotification({ ... });
} else if (req.user.role === 'customer') {
  // Customer rejected vendor's request
  sendNotification({ ... });
}
```

---

### 3. **New Function: `extensionsRequestForCustomer`**
**File:** `src/controllers/requestController.js`

#### Purpose:
Allows customers to view pending extension requests (from vendors)

#### Implementation:
```javascript
const extensionsRequestForCustomer = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const extensionRequests = await Extensionbooking.find({
    request: 'pending',
    customerId: req.user._id  // Find requests for this customer
  })
    .populate('bookingId')
    .populate('vendorId')
    .populate({
      path: 'bookingId',
      populate: { path: 'service' }
    })
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });
  
  const totalRequests = await Extensionbooking.countDocuments({
    request: 'pending',
    customerId: req.user._id
  });

  res.status(200).json({
    status: 'success',
    data: {
      extensionRequests,
      total: totalRequests,
      page,
      totalPages: Math.ceil(totalRequests / limit)
    }
  });
});
```

---

### 4. **Updated `extensionsRequestForVendor`**
**File:** `src/controllers/requestController.js`

#### Changes:
- ✅ Added `.sort({ createdAt: -1 })` - Shows newest requests first

---

### 5. **Updated Exports**
**File:** `src/controllers/requestController.js`

#### Added:
```javascript
module.exports = {
  // ... existing exports
  extensionsRequestForCustomer,  // ✅ New export
};
```

---

## 📊 Notification Flow Changes

### Customer Extension Request (Unchanged):
```
Customer → Vendor
Request: "John Doe has requested to extend their booking until Oct 25"

Vendor Accepts → Customer
Accept: "Your booking extension request has been accepted by Jane Smith until Oct 25"

Vendor Rejects → Customer
Reject: "Your booking extension request has been rejected by Jane Smith"
```

### Vendor Extension Request (NEW):
```
Vendor → Customer
Request: "Jane Smith has requested to extend your booking until Oct 25"

Customer Accepts → Vendor
Accept: "John Doe has accepted your booking extension request until Oct 25"

Customer Rejects → Vendor
Reject: "John Doe has rejected your booking extension request"
```

### Admin Extension (Unchanged):
```
Admin → Customer
"Your booking extension has been confirmed by admin until Oct 25"

Admin → Vendor
"Booking extension for John Doe has been confirmed by admin until Oct 25"
```

---

## 🔄 Updated Workflow

### Before (Old Behavior):
```
Customer Request → Vendor Approval → ✅ Extended
Vendor Request → ❌ Auto-Approved → ✅ Extended
Admin Request → ❌ Auto-Approved → ✅ Extended
```

### After (New Behavior):
```
Customer Request → Vendor Approval → ✅ Extended
Vendor Request → Customer Approval → ✅ Extended  ✅ NEW!
Admin Request → Auto-Approved → ✅ Extended
```

---

## 🎯 Benefits

### ✅ **Fair Process**
- Both customer and vendor have equal rights
- Both parties must agree to booking changes

### ✅ **Better Communication**
- Clear notifications for all parties
- Users know who initiated and approved extensions

### ✅ **Payment Protection**
- Payment not captured until both parties agree
- No charges for rejected extensions

### ✅ **Transparency**
- Complete audit trail of who requested what
- Rejection reasons can be tracked

### ✅ **Customer Control**
- Customers can decline vendor extension requests
- Protects customers from unwanted extensions

---

## 🧪 Testing Guide

### Test Vendor → Customer Extension Flow:

1. **Create Extension as Vendor:**
   ```bash
   POST /api/booking/extend/:bookingId
   Authorization: Bearer <vendor_token>
   
   {
     "startDate": "2025-10-20",
     "endDate": "2025-10-25",
     "timezone": "America/New_York"
   }
   ```
   ✅ Expected: Extension created with `request: 'pending'`  
   ✅ Expected: Customer receives notification

2. **Customer Views Pending Requests:**
   ```bash
   GET /api/booking/extension/customer/pending
   Authorization: Bearer <customer_token>
   ```
   ✅ Expected: Shows vendor's extension request

3. **Customer Approves:**
   ```bash
   POST /api/booking/extension/:extensionId/action
   Authorization: Bearer <customer_token>
   
   {
     "action": "accept"
   }
   ```
   ✅ Expected: Payment captured  
   ✅ Expected: Booking updated  
   ✅ Expected: Vendor receives acceptance notification

4. **Customer Rejects:**
   ```bash
   POST /api/booking/extension/:extensionId/action
   Authorization: Bearer <customer_token>
   
   {
     "action": "reject"
   }
   ```
   ✅ Expected: Payment canceled  
   ✅ Expected: Extension marked rejected  
   ✅ Expected: Vendor receives rejection notification

---

## 📝 API Routes to Add/Update

### New Route (Customer Pending Requests):
```javascript
// src/routes/bookingRoute.js or requestRoute.js

router.get(
  '/extension/customer/pending',
  requireAuth,
  restrictTo('customer'),
  extensionsRequestForCustomer
);
```

### Existing Routes (No changes needed):
```javascript
// These routes already exist and work with the updated logic
POST   /booking/extend/:bookingId
POST   /booking/extension/:extensionId/action
GET    /booking/extension/vendor/pending
GET    /booking/extension/:extensionId
GET    /booking/:bookingId/extension/history
```

---

## 📚 Documentation Created

### 1. **BOOKING_EXTENSION_SYSTEM.md**
Complete guide covering:
- Extension request workflow
- Role-based behavior
- API endpoints with examples
- Validation rules
- Payment flow
- Notification details
- Example scenarios
- Testing checklist

### 2. **This Implementation Summary**
Quick reference for developers showing:
- What changed and why
- Code comparisons
- New functions
- Testing guide
- Routes to add

---

## 🚀 Next Steps

1. **Add Route for Customer Pending Requests**
   - Add `extensionsRequestForCustomer` to routes file
   - Map to `GET /extension/customer/pending`

2. **Test All Scenarios**
   - Customer → Vendor extension flow
   - Vendor → Customer extension flow (NEW)
   - Admin extension flow
   - Rejection flows

3. **Update Postman Collection** (Optional)
   - Add customer pending requests endpoint
   - Add rejection test cases
   - Document new notification messages

4. **Frontend Updates** (If applicable)
   - Add "Pending Extension Requests" section for customers
   - Update vendor extension UI to show "Pending Approval"
   - Add accept/reject buttons for customers

---

## ⚠️ Breaking Changes

### For Frontend:
- Vendor extensions no longer auto-approved
- Vendors need to wait for customer approval
- New notification types for vendor extension requests

### For Mobile Apps:
- Update notification handling for `booking_extension` from vendors
- Add customer approval flow UI
- Update extension request list to include vendor-initiated requests

---

## 🔧 Files Modified

1. ✅ `src/controllers/requestController.js` - Updated extension logic
2. ✅ `docs/BOOKING_EXTENSION_SYSTEM.md` - Complete documentation
3. ⏳ `src/routes/*.js` - Need to add new route for customer pending requests

---

## 📞 Support

If you encounter any issues:

1. Check error logs for detailed error messages
2. Verify authorization tokens are valid
3. Ensure booking status is 'booked'
4. Confirm dates don't conflict with existing bookings
5. Check payment method is valid

---

**Implementation Date:** October 13, 2025  
**Status:** ✅ Complete - Ready for Route Integration and Testing  
**Breaking Change:** Yes - Vendor extensions now require customer approval
