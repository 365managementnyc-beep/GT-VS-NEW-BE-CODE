const mongoose = require('mongoose');

const globalPreferencesSchema = new mongoose.Schema({
  preferredLanguage: {
    type: String,
    default: 'English',
  },
  preferredCurrency: {
    type: String,
    default: 'USD',
  },
  timeZone: {
    type: String,
    default: 'UTC',
  },
  calendarStartOfWeek: {
    type: String,
    enum: [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ],
    default: 'monday',
  }
  
});

module.exports = {globalPreferencesSchema};

