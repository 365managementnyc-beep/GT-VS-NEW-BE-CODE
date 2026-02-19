const cron = require('node-cron');
const stripe = require('stripe')(process.env.STRIPE_SECRET_ACCESS_KEY);
const moment = require('moment');
const Booking = require('../models/Bookings');
cron.schedule('* * * * *', async () => {
  try {
    console.log('========================================');
    console.log('Starting auto-delete job for expired pending bookings...');
    console.log(`Current time: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
    
    const cutoffDate = moment().subtract(6, 'days').toDate();
    console.log(`Cutoff date: ${moment(cutoffDate).format('YYYY-MM-DD HH:mm:ss')}`);

    // Find all old pending bookings older than 6 days
    const bookings = await Booking.find({
      status: 'pending',
      createdAt: { $lt: cutoffDate },
      isDeleted: false
    }).populate('user', 'firstName lastName email');

    console.log(`Found ${bookings.length} pending bookings older than 6 days.`);

    if (bookings.length === 0) {
      console.log('No bookings to delete. Job completed.');
      console.log('========================================');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const booking of bookings) {
      try {
        console.log(`\nProcessing booking ${booking._id}...`);
        
        // Cancel paymentIntent if it exists
        if (booking.paymentIntentId) {
          try {
            const intent = await stripe.paymentIntents.retrieve(booking.paymentIntentId);
            console.log(`  PaymentIntent status: ${intent.status}`);

            // Cancel if payment intent is still in a cancelable state
            if (
              ['requires_payment_method', 'requires_capture', 'requires_confirmation', 'requires_action', 'processing'].includes(intent.status)
            ) {
              await stripe.paymentIntents.cancel(booking.paymentIntentId);

              console.log(`  ✓ Created payment history record (Canceled)`);
            } else if (intent.status === 'canceled') {
              console.log(`  ⚠ PaymentIntent already canceled: ${booking.paymentIntentId}`);
            } else {
              console.log(`  ⚠ PaymentIntent in status "${intent.status}" - not cancelable`);
            }
          } catch (stripeError) {
            // Payment intent might not exist or already deleted
            if (stripeError.code === 'resource_missing') {
              console.log(`  ⚠ PaymentIntent not found (already deleted): ${booking.paymentIntentId}`);
            } else {
              console.error(`  ✗ Stripe error: ${stripeError.message}`);
            }
          }
        } else {
          console.log(`  ⚠ No paymentIntentId found for booking ${booking._id}`);
        }

        // Soft delete the booking
        await Booking.deleteOne({ _id: booking._id });
        console.log(`  ✓ Soft deleted booking: ${booking._id}`);
        console.log(`  Customer: ${booking.user?.firstName} ${booking.user?.lastName} (${booking.user?.email})`);
        successCount++;
      } catch (error) {
        console.error(`  ✗ Failed to process booking ${booking._id}: ${error.message}`);
        failCount++;
      }
    }

    console.log('\n========================================');
    console.log('Auto-delete job finished.');
    console.log(`Total processed: ${bookings.length}`);
    console.log(`Success: ${successCount} | Failed: ${failCount}`);
    console.log('========================================');
  } catch (err) {
    console.error('========================================');
    console.error('Critical error in auto-delete cron job:', err.message);
    console.error(err.stack);
    console.error('========================================');
  }
});