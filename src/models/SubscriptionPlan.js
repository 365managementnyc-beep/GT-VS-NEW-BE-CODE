const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['free', 'essential', 'professional']
  },
  duration: {
    type: String,
    required: true,
    enum: ['monthly', 'yearly']
  },
  price: {
    type: Number,
    required: true
  },
  userType: {
    type: String,
    required: true,
    enum: ['student', 'musician', 'contractor']
  },
  permissions: {
    ads: { type: Boolean, required: true },
    storageLimit: { type: Number, required: true },
    maxTopicsPerDay: { type: Number, required: true },
    customization: { type: Boolean, required: true },
    handsUpLimit: { type: Number, required: true },
    gifsEnabled: { type: Boolean, required: true },
    priorityVisibility: { type: Boolean, required: true }
  }
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

module.exports = SubscriptionPlan;
