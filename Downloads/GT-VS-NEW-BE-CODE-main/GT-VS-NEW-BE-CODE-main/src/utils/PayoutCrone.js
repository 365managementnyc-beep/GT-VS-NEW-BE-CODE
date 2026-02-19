const cron = require('node-cron');
const moment = require('moment');
const Payments = require('../models/Payment'); // Assuming you have a Payout model
const { maintoConnect, } = require('./stripe-utils/stripe-transfer.util');
const sendNotification = require('./storeNotification');
const { receiveAccount } = require('./stripe-utils/connect-accounts.util');

cron.schedule('* * * * *', async () => {
  try {
    const now = moment().utc().toDate();
    console.log('Current time:', now);
    const pendingPayments = await Payments.find({
      status: 'pending'
    }).populate([
      {
        path: 'vendorId',
        model: 'User'
      },
      {
        path: 'booking',
        model: 'Booking',
        populate: {
          path: 'service',
          select: 'title'
        }
      }
    ]);
    console.log(`Found ${pendingPayments.length} pending payments to process.`);

    for (const payment of pendingPayments) {
      try {
        if (payment?.vendorId?.stripeAccountId) {
          const account = await receiveAccount(payment.vendorId.stripeAccountId);
          if (account?.charges_enabled || account?.payouts_enabled) {
            const amountInCents = Math.round(payment.amount * 100);
            const transfer = await maintoConnect({
              vendor: payment.vendorId,
              amountInCents: amountInCents
            });
            
            if (transfer) {
              payment.status = 'completed';
              await payment.save();
          
              sendNotification({
                userId: payment.vendorId._id,
                title: 'Payout Confirmed',
                message: `Your payout of $${payment.amount} for booking #${payment.booking?._id} ("${payment.booking?.service?.title}") has been successfully processed.`,
                type: 'payout',
                fortype: 'payout',
                permission: 'bookings',
                linkUrl: `/vendor-dashboard/PayOut-Details`
              });
              
              console.log(`Payment ${payment._id} processed successfully for vendor ${payment.vendorId._id}.`);
            }
          } else {
            console.log(`Vendor ${payment.vendorId._id} account not enabled for transfers.`);
          }
        } else {
          // console.log(`Payment ${payment?._id} - Vendor has no Stripe account ID.`);
        }
      } catch (paymentError) {
        console.error(`Error processing payment ${payment._id}: ${payment.vendorId?.stripeAccountId}`, paymentError);
      }
    }
  } catch (err) {
    console.error('Error updating booking statuses and creating payout history:', err);
  }
});
