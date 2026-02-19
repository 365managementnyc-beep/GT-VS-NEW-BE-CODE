const stripe = require('../config/stripe');
const Vendor = require('../models/users/Vendor');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Stripe Webhook Controller
exports.stripeWebhook = catchAsync(async (req, res, next) => {
  if (!stripe) {
    return res.status(503).json({
      status: 'fail',
      message: 'Stripe is not configured on this environment.'
    });
  }

  const sig = req.headers["stripe-signature"];
  let event;
  console.log("webhook triggered");
  console.log("event.type", event?.type);
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.log(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {

    case "account.updated": {
      const account = event.data.object;
      const stripeId = account.id;
      const stripeRecord = await Vendor.findOne({ stripeAccountId: stripeId });

      if (!stripeRecord) {
        return next(new AppError(`No Stripe account found with ID ${stripeId}`, 404));
      }

      // Check if account is fully onboarded and can accept payments
      let status  ;
      if (account?.charges_enabled && account.details_submitted) {
        status = "active";
      } else {
        status = "inactive";
      }

      await Vendor.findOneAndUpdate(
        { stripeAccountId: stripeId },
        { accountStatus: status },
        { new: true }
      );
      console.log(`✅ Account status updated for Stripe ID: ${stripeId}`);
      console.log(`Current status: ${status}`);

      break;
    }

    case "account.application.authorized": {
      const account = event.data.object;
      console.log(`🔓 Application authorized for connected account: ${account.id}`);
      break;
    }

    case "account.application.deauthorized": {
      const account = event.data.object;
      console.log(`🚫 Application deauthorized for connected account: ${account.id}`);
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).send();
});

