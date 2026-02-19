const cron = require('node-cron');
const stripe = process.env.STRIPE_SECRET_ACCESS_KEY ? require('stripe')(process.env.STRIPE_SECRET_ACCESS_KEY) : null;
const moment = require('moment');
const Booking = require('../models/Bookings');

// Run every day at 1:30 AM
// cron.schedule('* * * * *', async () => {
//   try {
//     const cutoffDate = moment().subtract(6, 'days').toDate();

//     // Find all old pending bookings
//     const bookings = await Booking.find({
//       status: 'pending',
//       createdAt: { $lt: cutoffDate },
//       isDeleted: false
//     });

//     console.log(`Found ${bookings.length} old pending bookings.`);

//     for (const booking of bookings) {
//       try {
//         // Cancel paymentIntent if it still exists and not captured
//         const intent = await stripe.paymentIntents.retrieve(booking.paymentIntentId);

//         if (
//           ['requires_payment_method', 'requires_capture', 'requires_confirmation', 'processing'].includes(intent.status)
//         ) {
//           await stripe.paymentIntents.cancel(booking.paymentIntentId);
//           console.log(`Canceled paymentIntent: ${booking.paymentIntentId}`);
//         }

//         // Hard delete the booking
//         await Booking.updateOne({ _id: booking._id }, { isDeleted: true }, { new: true });
//         console.log(`Deleted booking: ${booking._id}`);
//       } catch (stripeError) {
//         console.error(`Failed for booking ${booking._id}: ${stripeError.message}`);
//       }
//     }

//     console.log('Auto-delete job finished.');
//   } catch (err) {
//     console.error('Error in auto-delete cron job:', err.message);
//   }
// });
