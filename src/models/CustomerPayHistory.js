const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    payoutId: {
      type: String,
      required: true,
      unique: true // Example: '9090'
    },
    extensionRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Extensionbooking'
    },
    bank: {
      type: String,
      required: true
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    totalAmount: {
      type: Number,
      required: true // Store in smallest currency unit if Stripe (e.g., cents)
    },
    status: {
      type: String,
      enum: ['Paid', 'Pending', 'Failed', 'Refunded'],
      default: 'Pending'
    },
    refundType: {
      type: String,
      enum: ['Full', 'Partial',''],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Payout', payoutSchema);
