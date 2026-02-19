# Quick Reference - Buffer Time Implementation

## What Was Changed

### 1. **calculateServicePrice.js**
Added new function: `checkBufferTimeAvailability()`
- Validates minimum duration
- Checks buffer gaps between bookings
- Vendor-side availability check only

### 2. **requestController.js** - Three Updates

#### A. Imports
```javascript
const {
  getServiceBookingPrice,
  checkBookingDatesForExtension,
  checkBufferTimeAvailability  // ← NEW
} = require('../utils/calculateServicePrice');
```

#### B. checkServiceAvailability endpoint
- Calls `checkBufferTimeAvailability()` 
- Returns buffer info in response
- Availability check before customer can book

#### C. createBooking function
- Validates buffer before creating booking
- Does NOT affect price
- Prevents overbooking with buffer gaps

#### D. extendBooking function
- Validates buffer for extensions
- Prevents extending into buffer periods
- Does NOT affect extension price

## How It Works

```
Customer tries to book → System checks:
  1. Is there an existing booking? (existing logic)
  2. Is there a calendar block? (existing logic)
  3. Does proposed booking meet minimum duration? (NEW)
  4. Is buffer time available? (NEW)
  
If all checks pass → Booking created at normal price
If buffer check fails → Booking rejected, reason provided
```

## Configuration Example

**On Service Listing:**
```
bufferTime: 30           // Gap between bookings
bufferTimeUnit: minutes
minimumDuration: 2       // Minimum booking length
durationUnit: hours
```

**Result:**
- Any booking must be at least 2 hours
- Any two bookings must have 30 minutes gap
- Price unchanged - only availability affected

## Key Points

✅ **Vendor-side only** - affects only availability, not pricing
✅ **Backward compatible** - default buffer = 0 (disabled)
✅ **No schema changes** - uses existing fields
✅ **Prevents overbooking** - with configurable gaps
✅ **Respects minimum duration** - vendor can enforce minimums

## Test the Implementation

```bash
# 1. Create a service with buffer settings
POST /api/service
{
  "title": "Meeting Room",
  "bufferTime": 30,
  "bufferTimeUnit": "minutes",
  "minimumDuration": 1,
  "durationUnit": "hours"
}

# 2. Check availability
POST /api/booking/availability/:serviceId
{
  "checkIn": "2025-11-22T10:00:00Z",
  "checkOut": "2025-11-22T11:00:00Z"
}

# 3. Book service
POST /api/booking
{
  "service": ":serviceId",
  "checkIn": "2025-11-22T10:00:00Z",
  "checkOut": "2025-11-22T11:00:00Z",
  ...
}

# 4. Try to book immediately after (should fail)
POST /api/booking
{
  "service": ":serviceId",
  "checkIn": "2025-11-22T11:00:00Z",  # Buffer violation!
  "checkOut": "2025-11-22T12:00:00Z",
  ...
}
Response: "Service is not available. Previous booking ends at 11:30 AM..."

# 5. Book after buffer (should succeed)
POST /api/booking
{
  "service": ":serviceId",
  "checkIn": "2025-11-22T11:30:00Z",  # After buffer
  "checkOut": "2025-11-22T12:30:00Z",
  ...
}
Response: Booking created successfully
```

## Files Modified

1. `/src/utils/calculateServicePrice.js` - Added function
2. `/src/controllers/requestController.js` - Added 3 integration points
3. `/docs/BUFFER_TIME_AVAILABILITY.md` - Full documentation

## No Impact On

- ❌ Price calculation
- ❌ Booking schema
- ❌ Customer payment flow
- ❌ Invoice/receipt generation
- ❌ Existing bookings
