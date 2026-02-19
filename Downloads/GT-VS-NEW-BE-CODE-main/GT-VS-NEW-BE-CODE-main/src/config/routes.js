const express = require('express');
const {
  authRoute,
  vendorRoute,
  planRoute,
  uploadRoute,
  subcriptionRoute,
  listingRoute,
  amenityRoute,
  gadgetRoute,
  categoryRoute,
  kycRoute,
  faqRoute,
  userRoute,
  requestRoute,
  disputeRoute,
  accountRoute,
  textForumRoute,
  reviewRoute,
  reportReviewRoute,
  advertisementRoute,
  templeteRoute,
  subAdminRoute,
  cityRoute,
  countryRoute,
  logsRoute,
  discountRoute,
  settingRoute,
  payoutRoute,
  topicRoute,
  calendarRoute,
  paymentRoute,
  reportRoute,
  staffRoute,
  newsLetterRoute,
  filterRoute,
  messageRoute,
  supportRoute,
  eventTypeRoute,
  clientReviewRoute,
  alertRoute,
  suspensionRoute
} = require('../routes');

const otherRoutes = require('./otherRoutes');
const { stripeWebhook } = require('../controllers/webhookController');

module.exports = (app) => {
  app.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
  app.use(express.json({ limit: '30mb' }));
  app.use('/api/auth', authRoute);
  app.use("/api/message", messageRoute);
  app.use('/api/user', userRoute);
  app.use('/api/vendor', vendorRoute);
  app.use('/api/upload', uploadRoute);  
  app.use('/api/kycRoute', kycRoute);
  app.use('/api/plan', planRoute);
  app.use('/api/subscription', subcriptionRoute);
  app.use('/api/servicelisting', listingRoute);
  app.use('/api/amenity', amenityRoute);
  app.use('/api/gadget', gadgetRoute);
  app.use('/api/serviceCategory', categoryRoute);
  app.use('/api/Faq', faqRoute);
  app.use('/api/request-booking', requestRoute);
  app.use('/api/dispute',disputeRoute)
  app.use('/api/account',accountRoute)
  app.use('/api/taxForum', textForumRoute);
  app.use('/api/review', reviewRoute);
  app.use('/api/report-review', reportReviewRoute);
  app.use('/api/advertisement', advertisementRoute);
  app.use('/api/templete', templeteRoute);
  app.use('/api/subAdmin', subAdminRoute);
  app.use('/api/city', cityRoute);
  app.use('/api/country', countryRoute);
  app.use('/api/logs', logsRoute);
  app.use('/api/discount', discountRoute);
  app.use('/api/setting', settingRoute);
  app.use('/api/payout', payoutRoute);
  app.use('/api/topic', topicRoute);
  app.use('/api/calendar', calendarRoute);
  app.use('/api/payment', paymentRoute);
  app.use('/api/report', reportRoute);
  app.use('/api/subscription', subcriptionRoute);
  app.use('/api/staff', staffRoute);
  app.use('/api/newsletter', newsLetterRoute);
  app.use("/api/filter",filterRoute)
  app.use('/api/support', supportRoute);
  app.use('/api/event-type', eventTypeRoute);
  app.use('/api/client-review', clientReviewRoute);
  app.use('/api/alert', alertRoute);
  app.use('/api/suspension', suspensionRoute);
  otherRoutes(app);
};
                                                                                       