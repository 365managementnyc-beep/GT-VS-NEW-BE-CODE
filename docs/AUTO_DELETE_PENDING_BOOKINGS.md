# Auto-Delete Expired Pending Bookings - Cron Job

## 📋 Overview
This cron job automatically deletes pending bookings that are older than 6 days, as their payment intents have expired and cannot be captured.

---

## ⏰ Schedule

**Cron Pattern:** `30 1 * * *`

**Runs:** Daily at 1:30 AM

**Frequency:** Once per day

**For Testing:** Change to `* * * * *` to run every minute

---

## 🎯 Purpose

Stripe payment intents expire after a certain period (typically 7 days). This job:

1. ✅ Finds pending bookings older than 6 days
2. ✅ Cancels associated Stripe payment intents (if still active)
3. ✅ Creates payment history records for canceled payments
4. ✅ Soft deletes the expired bookings
5. ✅ Cleans up database from stale pending bookings

---

## 🔍 Selection Criteria

The job targets bookings with:

```javascript
{
  status: 'pending',           // Only pending bookings
  createdAt: { $lt: cutoffDate },  // Older than 6 days
  isDeleted: false             // Not already deleted
}
```

**Cutoff Calculation:**
```javascript
const cutoffDate = moment().subtract(6, 'days').toDate();
```

**Example:**
- Current Date: October 15, 2025
- Cutoff Date: October 9, 2025 (6 days ago)
- Targets: Bookings created before October 9, 2025

---

## 🔄 Process Flow

```
1. Start Cron Job (1:30 AM daily)
   ↓
2. Calculate cutoff date (6 days ago)
   ↓
3. Find pending bookings older than cutoff
   ↓
4. For each booking:
   ├─→ Retrieve payment intent from Stripe
   ├─→ Cancel payment intent (if cancelable)
   ├─→ Create PayHistory record (status: Canceled)
   ├─→ Soft delete booking (isDeleted: true)
   └─→ Log success/failure
   ↓
5. Log summary (total, success, failed)
   ↓
6. End Job
```

---

## 💳 Payment Intent Handling

### Cancelable Statuses:
Payment intents in these statuses will be canceled:

- `requires_payment_method` - Awaiting payment method
- `requires_capture` - Payment authorized, awaiting capture
- `requires_confirmation` - Awaiting confirmation
- `requires_action` - Requires customer action
- `processing` - Currently processing

### Non-Cancelable Statuses:
- `succeeded` - Already completed (won't be found as pending)
- `canceled` - Already canceled (logged but skipped)
- Other statuses - Logged and skipped

### Error Handling:
- **`resource_missing`** - Payment intent already deleted (logged, continues)
- **Other Stripe errors** - Logged, booking still deleted
- **No paymentIntentId** - Booking still deleted (logged)

---

## 📊 Payment History Record

For each canceled payment intent, a record is created:

```javascript
{
  payoutId: 'pi_xxx',           // Stripe payment intent ID
  customerId: 'customer_id',    // User who made booking
  bookingId: 'booking_id',      // Associated booking
  bank: 'visa',                 // Card brand
  totalAmount: 150,             // Amount in dollars
  status: 'Canceled',           // Payment status
  refundType: 'Auto-Expired'    // Reason for cancellation
}
```

---

## 📝 Logging

### Startup Log:
```
✓ Cron job scheduled: Auto-delete expired pending bookings
  Schedule: Daily at 1:30 AM
  Target: Pending bookings older than 6 days
```

### Job Execution Log:
```
========================================
Starting auto-delete job for expired pending bookings...
Current time: 2025-10-15 01:30:00
Cutoff date: 2025-10-09 01:30:00
Found 5 pending bookings older than 6 days.

Processing booking 67890...
  PaymentIntent status: requires_capture
  ✓ Canceled paymentIntent: pi_abc123
  ✓ Created payment history record (Canceled)
  ✓ Soft deleted booking: 67890
  Customer: John Doe (john@example.com)

Processing booking 67891...
  ⚠ PaymentIntent already canceled: pi_def456
  ✓ Soft deleted booking: 67891
  Customer: Jane Smith (jane@example.com)

========================================
Auto-delete job finished.
Total processed: 5
Success: 5 | Failed: 0
========================================
```

### No Bookings Found:
```
Found 0 pending bookings older than 6 days.
No bookings to delete. Job completed.
```

### Error Log:
```
  ✗ Failed to process booking 67892: Connection timeout
```

---

## 🛠️ Configuration

### Change Schedule:

**Production (Daily at 1:30 AM):**
```javascript
cron.schedule('30 1 * * *', async () => {
```

**Testing (Every Minute):**
```javascript
cron.schedule('* * * * *', async () => {
```

**Other Common Schedules:**
```javascript
// Every hour at minute 30
cron.schedule('30 * * * *', ...)

// Every 6 hours
cron.schedule('0 */6 * * *', ...)

// Twice daily (1:30 AM and 1:30 PM)
cron.schedule('30 1,13 * * *', ...)

// Only on weekdays at 1:30 AM
cron.schedule('30 1 * * 1-5', ...)
```

### Change Cutoff Period:

**6 Days (Current):**
```javascript
const cutoffDate = moment().subtract(6, 'days').toDate();
```

**7 Days:**
```javascript
const cutoffDate = moment().subtract(7, 'days').toDate();
```

**24 Hours:**
```javascript
const cutoffDate = moment().subtract(24, 'hours').toDate();
```

---

## 📈 Statistics Tracking

The job tracks:
- **Total bookings found** - Number of pending bookings older than cutoff
- **Success count** - Successfully processed and deleted
- **Fail count** - Failed to process (but may still be deleted)
- **Execution time** - Logged timestamps for monitoring

---

## 🧪 Testing

### Manual Test:

1. **Create test pending bookings** (older than 6 days):
   ```javascript
   await Booking.create({
     status: 'pending',
     createdAt: moment().subtract(7, 'days').toDate(),
     // ... other fields
   });
   ```

2. **Run job manually** (change schedule to `* * * * *`):
   ```bash
   npm run dev
   # Wait for next minute
   # Check logs
   ```

3. **Verify results**:
   - Check logs for processed bookings
   - Check database for `isDeleted: true`
   - Check Stripe for canceled payment intents
   - Check PayHistory for canceled records

### Automated Testing:
```javascript
// Create test booking
const testBooking = await Booking.create({
  status: 'pending',
  createdAt: moment().subtract(7, 'days').toDate(),
  paymentIntentId: 'pi_test_123',
  user: testUser._id,
  service: testService._id,
  checkIn: moment().add(1, 'day').toDate(),
  checkOut: moment().add(2, 'days').toDate(),
  totalPrice: 100
});

// Wait for cron job to run
await sleep(65000); // Wait 65 seconds

// Verify
const deletedBooking = await Booking.findById(testBooking._id);
expect(deletedBooking.isDeleted).toBe(true);

const payHistory = await PayHistory.findOne({ bookingId: testBooking._id });
expect(payHistory.status).toBe('Canceled');
expect(payHistory.refundType).toBe('Auto-Expired');
```

---

## ⚠️ Important Notes

### 1. **Soft Delete Only**
- Bookings are soft deleted (`isDeleted: true`)
- Original data preserved for audit/reporting
- Can be restored if needed

### 2. **Payment Intent Expiration**
- Stripe payment intents typically expire after 7 days
- Running at 6 days ensures we cancel before expiration
- Expired payment intents cannot be captured

### 3. **Customer Impact**
- Customers with pending bookings older than 6 days will have them removed
- No refund needed (payment never captured)
- Customers can create new bookings if needed

### 4. **Vendor Impact**
- Vendors won't see old pending requests cluttering their dashboard
- No action needed from vendors
- Automatic cleanup keeps system clean

### 5. **Data Retention**
- Soft deleted bookings remain in database
- Can be analyzed for patterns (why bookings weren't confirmed)
- Can be permanently deleted in a separate job if needed

---

## 🔧 Troubleshooting

### Job Not Running?

1. **Check if cron is registered:**
   ```javascript
   // Ensure this file is imported in main app
   require('./jobs/autoDeleteOldPendingBookings');
   ```

2. **Check server logs:**
   ```bash
   # Should see at startup:
   ✓ Cron job scheduled: Auto-delete expired pending bookings
   ```

3. **Test with frequent schedule:**
   ```javascript
   // Change to every minute for testing
   cron.schedule('* * * * *', ...)
   ```

### Bookings Not Being Deleted?

1. **Check cutoff date calculation:**
   ```javascript
   console.log('Cutoff:', moment().subtract(6, 'days').format());
   ```

2. **Check booking criteria:**
   ```javascript
   // Verify bookings match all criteria:
   // - status: 'pending'
   // - createdAt older than cutoff
   // - isDeleted: false
   ```

3. **Check database query:**
   ```javascript
   const bookings = await Booking.find({
     status: 'pending',
     createdAt: { $lt: cutoffDate },
     isDeleted: false
   });
   console.log('Found bookings:', bookings.length);
   ```

### Payment Intents Not Canceling?

1. **Check Stripe credentials:**
   ```javascript
   // Ensure STRIPE_SECRET_ACCESS_KEY is set
   console.log('Stripe key:', process.env.STRIPE_SECRET_ACCESS_KEY?.substring(0, 10));
   ```

2. **Check payment intent status:**
   ```javascript
   const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
   console.log('Status:', intent.status);
   ```

3. **Handle expired intents:**
   ```javascript
   // Stripe returns 'canceled' for expired intents
   // Job will log and continue
   ```

---

## 📊 Monitoring

### Key Metrics to Track:

- **Bookings deleted per run** - Should be low if booking flow is healthy
- **Failed deletions** - Should be near zero
- **Execution time** - Should be consistent
- **Stripe API errors** - Track rate limits or connection issues

### Alerts to Set Up:

- ⚠️ Failed count > 5
- ⚠️ Execution time > 5 minutes
- ⚠️ Job didn't run in last 25 hours
- ⚠️ High number of old pending bookings (> 50)

---

## 🔄 Related Jobs

### `updateBookingStatus.js`
- **Purpose:** Mark bookings as 'completed' after checkout
- **Schedule:** Every minute
- **Creates:** Payout records for vendors

### Future Jobs:
- **Permanent delete soft-deleted bookings** - After 30+ days
- **Notify customers** - Before auto-deletion (grace period)
- **Analytics** - Track deletion patterns

---

## 📁 File Location

**Path:** `src/jobs/autoDeleteOldPendingBookings.js`

**Dependencies:**
- `node-cron` - Cron job scheduler
- `stripe` - Payment intent cancellation
- `moment` - Date calculations
- `Booking` model - Booking operations
- `PayHistory` model - Payment history tracking

---

## 🎯 Benefits

✅ **Automatic Cleanup** - No manual intervention needed

✅ **Database Hygiene** - Removes stale pending bookings

✅ **Payment Accuracy** - Cancels payment intents before expiration

✅ **Audit Trail** - Creates payment history for all cancellations

✅ **Customer Experience** - Removes confusing old pending bookings

✅ **Vendor Dashboard** - Keeps pending requests list clean

✅ **Resource Optimization** - Frees up database space

---

**Implementation Date:** October 15, 2025  
**Status:** ✅ Active and Running  
**Schedule:** Daily at 1:30 AM
