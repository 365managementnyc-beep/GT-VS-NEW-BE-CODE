const { Schema, model } = require('mongoose');

const ClientReviewSchema = new Schema(
  {
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [100, 'Client name cannot exceed 100 characters']
    },
    imageKey: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true 
  }
);

// Indexes for better query performance
ClientReviewSchema.index({ isDeleted: 1, isActive: 1 });
ClientReviewSchema.index({ rating: -1 });
ClientReviewSchema.index({ createdAt: -1 });

module.exports = model('ClientReview', ClientReviewSchema);
