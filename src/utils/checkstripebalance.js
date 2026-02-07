const cron = require('node-cron');
const moment = require('moment');
const Booking = require('../models/Bookings');
const Pricing = require('../models/Pricing');
const { checkStripeBalance } = require('./stripe-utils/stripe-transfer.util');
cron.schedule('0 0 * * *', async () => {
  try {
    const now = moment().utc().toDate();
    console.log('Current time:', now);

    const bookings = await Booking.find(
      { checkIn: { $lte: now }, status: {
        $in: ["booked", "completed"]}, paymentStatus: false }
    ).populate({
      path: 'service',
      select: 'vendorId title',
      populate: {
        path: 'vendorId',
        model: 'User', // Assuming the vendor is a User model
      }
    });

    console.log(`Found ${bookings.length} bookings to update and create payouts.`);
    const findBalance = await checkStripeBalance();
    let totalUnpaid = 0;

    for (const booking of bookings) {
      let amountafterfee = booking.totalPrice;
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
      totalUnpaid += amountafterfee;
    }

    if (totalUnpaid > findBalance?.available[0]?.amount / 100) {
      console.log(`Total unpaid amount exceeds available balance.`, totalUnpaid, '>', findBalance?.available[0]?.amount / 100);
      sendHtmlEmail({
        to: process.env.NOTIFICATION_EMAIL,
        subject: 'Stripe Balance Alert',
        html: `<p>Total unpaid amount of $${totalUnpaid} exceeds available balance of $${findBalance?.available[0]?.amount / 100}.</p>
           <p>Please add more funds to your Stripe account to cover upcoming payouts.</p>`
      });
    }

  } catch (err) {
    console.error('Error updating booking statuses and creating payout history:', err);
  }
});
