const mongoose = require("mongoose");
const { Schema, model } = require('mongoose');

const CountrySchema = new Schema({
  country: {
    type: String,
    required: true
  },
  region: {
    type: String,
    trim: true
  },
  currency: {
    type: String,
    trim: true
  },
  latlng: {
    type: [Number],
    validate: [(v) => Array.isArray(v) && v.length === 2, 'latlng must be an array of two numbers']
  },
  status: {
    type: String,
    enum: ["Inactive", "Active"],
    default: "Active"
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, { toJSON: { getters: true } });

module.exports = model('Country', CountrySchema);

