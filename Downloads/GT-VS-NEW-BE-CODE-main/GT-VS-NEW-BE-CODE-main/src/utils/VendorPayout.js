const cron = require('node-cron');
const moment = require('moment');
const Booking = require('../models/Bookings');
const Payments = require('../models/Payment'); // Assuming you have a Payout model
const Pricing = require('../models/Pricing');
const { maintoConnect, checkStripeBalance } = require('./stripe-utils/stripe-transfer.util');
const sendNotification = require('./storeNotification');
const { receiveAccount } = require('./stripe-utils/connect-accounts.util');

cron.schedule('* * * * *', async () => {
  try {
    const now = moment().utc().toDate();
    console.log('Current time:', now);

    const bookings = await Booking.find({
      checkIn: { $lte: now },
      status: {
        $in: ['booked', 'completed']
      },
      paymentStatus: false
    }).populate({
      path: 'service',
      select: 'vendorId title',
      populate: {
        path: 'vendorId',
        model: 'User' // Assuming the vendor is a User model
      }
    });

    console.log(`Found ${bookings.length} bookings to update and create payouts.`);
    const findBalance = await checkStripeBalance();
    // console.log('Stripe balance:', findBalance);

    for (const booking of bookings) {
      let amountafterfee = booking.totalPrice;
      let amountInCents = 0;
      if (booking.service.vendorId.customPricingPercentage) {
        const fee = (booking.totalPrice * booking.service.vendorId.customPricingPercentage) / 100;
        amountafterfee = booking.totalPrice - fee;
      } else {
        const pricing = await Pricing.findOne({});
        if (pricing) {
          const fee = (booking.totalPrice * pricing.pricingPercentage) / 100;
          amountafterfee = booking.totalPrice - fee;
        } else {
          console.log('No pricing found, using total price as amount after fee');
        }
      }
      amountInCents = Math.round(amountafterfee * 100);
      let status = 'pending';
      // console.log("Vendor Stripe Account ID:", booking?.service?.vendorId);
      if (booking?.service?.vendorId?.stripeAccountId) {
        const account = await receiveAccount(booking?.service?.vendorId?.stripeAccountId);
        // console.log('Account:', account);
        if (account?.charges_enabled || account?.payouts_enabled) {
          const transfer = await maintoConnect({
            vendor: booking.service.vendorId,
            amountInCents: amountInCents
          });
          // console.log('Transfer response:', booking?.service);
          if (transfer) {
            booking.paymentStatus = true;
            booking.save();
            status = 'completed';
            sendNotification({
              userId: booking?.service?.vendorId?._id,
              title: 'Payout Confirmed',
              message: `Your payout of $${booking?.totalPrice} for booking #${booking?._id} ("${booking?.service?.title}") has been successfully processed.`,
              type: 'payout',
              fortype: 'payout',
              permission: 'bookings',
              linkUrl: `/vendor-dashboard/PayOut-Details`
            });
          }
        }
      }
      const findExistingPayment = await Payments.findOne({ booking: booking._id.toString() });
      if (findExistingPayment) {
        findExistingPayment.status = status;
        await findExistingPayment.save();
      } else {
        await Payments.create({
          booking: booking._id.toString(),
          vendorId: booking.service.vendorId._id.toString(),
          amount: amountafterfee,
          status: status
        });
      }
      booking.paymentStatus = true;
      booking.save();
      console.log(`Booking ${booking._id} status updated and payout history created.`);
    }
  } catch (err) {
    console.error('Error updating booking statuses and creating payout history:', err);
  }
});
