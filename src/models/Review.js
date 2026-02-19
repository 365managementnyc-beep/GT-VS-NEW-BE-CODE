const { Schema, model } = require('mongoose');

const reviewSchema = new Schema(
  // FIXME: Not finalized yet
  {
    reviewer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reviewOn: {
      type: Schema.Types.ObjectId,
      refPath: 'Booking',
      required: true
    },
    reviewType: {
      type: String,
      enum: ['positive', 'negative'],
      default: 'positive'
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    hide: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

reviewSchema.index({ reviewer: 1, reviewOn: 1 });
reviewSchema.index({ isDeleted: 1 });

module.exports = model('Review', reviewSchema);

