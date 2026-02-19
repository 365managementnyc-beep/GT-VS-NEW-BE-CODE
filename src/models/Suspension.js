const { Schema, model } = require('mongoose');

const suspensionSchema = new Schema(
  {
    // User/Vendor/Admin being suspended
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userRole: {
      type: String,
      enum: ['admin', 'customer', 'vendor', 'staff'],
      required: true
    },
    userName: String,
    userEmail: String,
    
    // Suspension details
    reason: {
      type: String,
      required: true,
      trim: true
    },
    suspensionType: {
      type: String,
      enum: ['temporary', 'permanent'],
      default: 'temporary',
      required: true
    },
    
    // Duration for temporary suspensions
    duration: {
      type: Number, // Duration value
      default: null
    },
    durationUnit: {
      type: String,
      enum: ['hours', 'days', 'weeks', 'months'],
      default: 'days'
    },
    
    // Calculated suspension dates
    suspendedAt: {
      type: Date,
      default: Date.now
    },
    suspensionEndDate: {
      type: Date, // null for permanent
      default: null
    },
    
    // Admin who applied suspension
    suspendedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    suspendedByName: String,
    
    // Status
    status: {
      type: String,
      enum: ['active', 'lifted', 'expired'],
      default: 'active'
    },
    
    // Additional info
    appealReason: String,
    appealedAt: Date,
    appealStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: null
    },
    liftedAt: Date,
    liftedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    liftReason: String,
    
    notes: String
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtuals
suspensionSchema.virtual('isActive').get(function() {
  if (this.status === 'lifted' || this.status === 'expired') {
    return false;
  }
  
  if (this.suspensionType === 'permanent') {
    return true;
  }
  
  // Check if temporary suspension has expired
  if (this.suspensionEndDate && this.suspensionEndDate < new Date()) {
    return false;
  }
  
  return true;
});

suspensionSchema.virtual('remainingTime').get(function() {
  if (!this.isActive || !this.suspensionEndDate) {
    return null;
  }
  
  const now = new Date();
  const remaining = this.suspensionEndDate - now;
  
  if (remaining < 0) return null;
  return remaining;
});

// Indexes
suspensionSchema.index({ userId: 1, suspendedAt: -1 });
suspensionSchema.index({ status: 1 });
suspensionSchema.index({ suspendedAt: -1 });
suspensionSchema.index({ suspensionEndDate: 1 });

module.exports = model('Suspension', suspensionSchema);
