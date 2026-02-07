const { Schema, model } = require('mongoose');

const Gadgets = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});
module.exports = model('ServiceGadgets', Gadgets);
