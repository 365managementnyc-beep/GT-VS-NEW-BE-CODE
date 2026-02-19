const NotificationSetting = require('../models/NotificationPermission');

const settings = [
  { title: 'New Venue Application', type: 'new_venue', email: false, sms: false, mobile: false },
  {
    title: 'Service Favorite',
    type: 'service_like',
    email: false,
    sms: false,
    mobile: false
  },
  {
    title: 'Venue Feedback Received',
    type: 'venue_feedback',
    email: false,
    sms: false,
    mobile: false
  },
  {
    title: 'Venue Cancellation Alert',
    type: 'venue_cancellation',
    email: false,
    sms: false,
    mobile: false
  },
  {
    title: 'Customer Support Tickets',
    type: 'customer_support',
    email: false,
    sms: false,
    mobile: false
  },
  {
    title: 'Inbox',
    type: 'inbox',
    email: false,
    sms: false,
    mobile: false
  }
];

const populateNotificationSetting = async () => {
  await NotificationSetting.deleteMany({});
  console.log('Existing notification setting deleted.');

  await NotificationSetting.insertMany(settings);
  console.log('Notification settings added successfully!');
};

module.exports = populateNotificationSetting;
