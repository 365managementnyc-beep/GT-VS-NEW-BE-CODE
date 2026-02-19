const { Schema, model } = require('mongoose');

const ReportReviewSchema = new Schema(
  {
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Review',
      required: true
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reportType: {
      type: String,
      enum: ['Off_topic','Spam','Conflict','Profanity','Harassment','Hate_speech','Personal_information','Not_helpful','Other'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'resolved', 'rejected'],
      default: 'pending'
    },
    adminNote: {
      type: String,
      default: ''
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: {
      type: Date
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

ReportReviewSchema.index({ isDeleted: 1 });
ReportReviewSchema.index({ status: 1 });
ReportReviewSchema.index({ reportedBy: 1 });
ReportReviewSchema.index({ reviewId: 1 });

module.exports = model('ReportReview', ReportReviewSchema);
