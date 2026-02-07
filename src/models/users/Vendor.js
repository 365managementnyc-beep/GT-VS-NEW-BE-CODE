const { Schema } = require('mongoose');
const User = require('./User');

const vendorSchema = new Schema({
  permissions: [String],
  stripeAccountId: {
    type: String,
    trim: true
  },
  vendorRole: {
    type: String,
    enum: ['vendor', 'staff'],
    default: 'vendor'
  },
  staffOf: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [
      function () {
        // only required when vendorRole is 'staff'
        return this.vendorRole === 'staff';
      },
      'staffOf is required when vendorRole is staff'
    ]
  },
  permissions: [{
    type: String,
    enum: ['dashboard', 'inbox', 'calendar','listings','booking_requests','cancelled_bookings','cancelled_requests','completed_bookings','confirm_bookings','reject_bookings','extend_requests','payouts','reviews','settings','staff','discounts','profile','analytics','setting','help','notifications','dispute']
  }],
  staffRole: {
    type: String,
    trim: true
  },
  kycStatus: {
    type: String,
    enum: ['pending', "inprogress", 'abandoned', 'expired', "resubmission_requested", "approved"],
    default: 'pending'
  },
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'pending'],
    default: 'pending'
  },
  textForumStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected',"inprogress"],
    default: 'pending'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  customPricingPercentage: {
    type: Number,
    validate: {
      validator(value) {
        return value >= 0 && value <= 100;
      },
      message: 'customPricingPercentage must be between 0 and 100'
    }
  }
});

module.exports = User.discriminator('vendor', vendorSchema);
