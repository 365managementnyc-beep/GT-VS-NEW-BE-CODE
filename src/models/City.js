const mongoose = require("mongoose");
const { Schema, model } = require('mongoose');

const CitySchema = new Schema({
  country: {
    type: String,
    required: true
  },
  city: {
    type: String,
    trim: true
  },
  province: {
    type: String,
    trim: true
  },
  countrylatlng: {
    type: [Number],
    validate: [(v) => Array.isArray(v) && v.length === 2, 'latlng must be an array of two numbers']
  },
  citylatlng: {
    type: [Number],
    validate: [(v) => Array.isArray(v) && v.length === 2, 'latlng must be an array of two numbers']
  },
  provincelatlng: {
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
  }
}, { toJSON: { getters: true } });

module.exports = model('City', CitySchema);

