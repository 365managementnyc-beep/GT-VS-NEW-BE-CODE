const { Schema, model } = require('mongoose');

const categorySchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  }
});

categorySchema.index({ title: 1 });

module.exports = model('ListingCategory', categorySchema);

