const { STRIPE_SECRET_ACCESS_KEY } = process.env;
const stripe = STRIPE_SECRET_ACCESS_KEY ? require('stripe')(STRIPE_SECRET_ACCESS_KEY) : null;

module.exports = {
  async createStripeExpressAccount(params) {
    try {
      const { email, country, userId } = params;
      const payload = {
        type: 'express',
        email,
        country,
        capabilities: {
          card_payments: {
            requested: true
          },
          transfers: {
            requested: true
          }
        },
        metadata: {
          userId: userId?.toString()
        }
      };


      const account = await stripe.accounts.create(payload);
      return account.id;
    } catch (err) {
      // logger.error(`In createStripeAccountExpress - ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  },
  async receiveAccount(stripeAccountId){
    try{
      const account = await stripe.accounts.retrieve(stripeAccountId);
      return account;
    }catch(error){
      return null;

    }

  },

  async createStripeOnBoardingLink(params) {
    try {
      const { accountId } = params;
      const accountLinks = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: process.env.STRIPE_REFRESH_URL,
        return_url: process.env.FRONTEND_URL,
        type: 'account_onboarding'
      });
      return accountLinks.url;
    } catch (err) {
      // logger.error(`In createStripeAccountExpress - ${JSON.stringify(err)}`);
      throw new Error(err);
    }
  },

async createPaymentIntents(params) {
  try {
    const { amount, currency, paymentMethodId, customerId, instantBookingCheck } = params;

    // Ensure amount is a valid integer (no decimals)
    const validAmount = Math.round(amount);
    console.log('Validated amount (in cents):', validAmount);
    if (!Number.isInteger(validAmount) || validAmount <= 0) {
      throw new Error(`Invalid amount: ${amount}. Amount must be a positive integer representing cents.`);
    }

    console.log('Creating payment intent with params:', { 
      amount: validAmount, 
      currency, 
      paymentMethodId, 
      customerId, 
      instantBookingCheck 
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: validAmount,
      currency,
      payment_method: paymentMethodId,
      customer: customerId,
      confirm: true, // confirm immediately
      capture_method: instantBookingCheck === true ? 'automatic' : 'manual',
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
    });

    // Fetch card details from the latest charge if available
    let cardDetails = null;
    if (paymentIntent.latest_charge) {
      const charge = await stripe.charges.retrieve(paymentIntent.latest_charge);
      if (charge?.payment_method_details?.card) {
        cardDetails = charge.payment_method_details.card;
      }
    }

    // Return paymentIntent along with card details
    return { ...paymentIntent, cardDetails };
  } catch (err) {
    throw new Error(err.message || err);
  }
}
}
