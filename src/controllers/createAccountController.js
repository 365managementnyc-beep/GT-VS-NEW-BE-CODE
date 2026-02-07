
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const stripe = require('stripe')(process.env.STRIPE_SECRET_ACCESS_KEY);


// Create a new FAQ
const createAccount = catchAsync(async (req, res, next) => {
    const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: req.body.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      });
  
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: 'https://your-app.com/stripe/onboarding/refresh',
        return_url: 'https://your-app.com/stripe/onboarding/return',
        type: 'account_onboarding'
      });
  
      // Save new account ID to DB
      // await User.findByIdAndUpdate(req.user.id, { stripeAccountId: account.id });
  
      res.json({ url: accountLink.url });
});

module.exports = {

    createAccount

};
