const { Schema, model } = require('mongoose');

const KYCSesssionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sessionToken: { type: String, unique: true, required: true },
  status: {
    type: String,
    enum: ['pending', 'verified', 'expired'],
    default: 'pending'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  }, // 24-hour expiry
  createdAt: { type: Date, default: Date.now }
});

KYCSesssionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired sessions

module.exports = model('KYCSesssion', KYCSesssionSchema);
