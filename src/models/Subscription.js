const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userType: {
      type: String,
      enum: ['Essential', 'Professional', 'Free'],
      required: true
    },
    plan: {
      type: String,
      enum: ['musician', 'contractor', 'course'],
      required: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    type: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    verifiedBadge: {
      type: Boolean,
      default: false
    },

    permissions: {
      ads: {
        type: Boolean,
        default: true
      },
      storageLimit: {
        type: Number,
        default: 1
      },
      maxTopicsPerDay: {
        type: Number,
        default: 3
      },
      customization: {
        type: Boolean,
        default: false
      },
      handsUpLimit: {
        type: Number,
        default: 0
      },
      gifsEnabled: {
        type: Boolean,
        default: false
      },
      priorityVisibility: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;
