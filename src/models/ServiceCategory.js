const { Schema, model } = require('mongoose');

const serviceCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  blackIcon: {
    type: String,
    trim: true
  },
  whiteIcon: {
    type: String,
    trim: true
  },
  whiteKey: {
    type: String,
    trim: true
  },
  blackKey: {
    type: String,
    trim: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  typevalue:{
    type:String,
    enum:['vendor','venue'],
    default:'vendor'
  }
});

module.exports = model('ServiceCategory', serviceCategorySchema);
