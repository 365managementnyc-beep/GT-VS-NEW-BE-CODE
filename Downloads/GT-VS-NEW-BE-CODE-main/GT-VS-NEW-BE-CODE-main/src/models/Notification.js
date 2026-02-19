const { default: mongoose } = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['serviceListing', 'booking',"user", 'review',"message","payout",'alert'],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  linkUrl: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
