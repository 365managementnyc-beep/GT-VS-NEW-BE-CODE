const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema({
  faqType: {
    type: String,
    enum: ['landing', 'customer', 'vendor', 'service'],
    required: true
  },
  dataType: {
    type: String,
    enum: ['text', 'training'],
    required: true
  },
  // For "text" FAQs
  question: {
    type: String,
    required () {
      return this.dataType === 'text';
    }
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceListing"
  },
  answer: {
    type: String,
    required () {
      return this.dataType === 'text';
    }
  },
  // For "training" FAQs
  videoTitle: {
    type: String,
    required () {
      return this.dataType === 'training';
    }
  },
  videoLink: {
    type: String,
    required () {
      return this.dataType === 'training';
    }
  },
  videoDescription: {
    type: String,
    required () {
      return this.dataType === 'training';
    }
  },  
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Faq', faqSchema);

