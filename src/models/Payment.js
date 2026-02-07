const { Schema, model } = require('mongoose');

const paymentSchema = new Schema(
  // FIXME: Not finalized yet
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    systemFee: {
      type: Number,
      min: [0, 'System Fee must be positive'],
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

module.exports = model('Payments', paymentSchema);
