const stripe = process.env.STRIPE_SECRET_ACCESS_KEY 
  ? require('stripe')(process.env.STRIPE_SECRET_ACCESS_KEY)
  : null;

module.exports = stripe;
