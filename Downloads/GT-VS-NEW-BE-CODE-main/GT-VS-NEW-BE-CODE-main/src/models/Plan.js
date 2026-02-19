const { Schema, model } = require('mongoose');

const planSchema = new Schema({
  planType: {
    type: String,
    required: true,
    enum: ['Essential', 'Professional', 'Free']
  },
  planPrice: {
    monthly: { type: Number, required: true },
    quarterly: { type: Number, required: true },
    semiAnnual: { type: Number, required: true },
    annual: { type: Number, required: true },
    biennial: { type: Number, required: true }
  },
  planFor: {
    type: String,
    required: true,
    enum: ['course', 'musician', 'contractor']
  },
  features: {
    type: Map,
    of: new Schema(
      {
        title: { type: String, required: true },
        description: { type: String },
        limits: { type: Schema.Types.Mixed },
        prioritySupport: { type: Boolean, default: false }
      },
      { _id: false }
    ),
    default: {}
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course'
  },
  timeDuration: {
    isInfinite: {
      type: Boolean,
      default: false
    },
    value: {
      type: Number
    },
    unit: {
      type: String,
      enum: ['months', 'years']
    }
  },
  cancellationPolicy: {
    type: String,
    default: 'No cancellation penalty.'
  },
  earlyAccess: {
    enabled: { type: Boolean, default: false },
    timeFrame: { type: Number, default: null }
  },
  accessLimit: {
    type: Number,
    default: null
  },
  visibleInSearch: {
    type: Boolean,
    default: false
  },
  priorityInSearch: {
    type: Boolean,
    default: false
  }
});

const Plan = model('Plan', planSchema);
module.exports = Plan;
