const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const AdvertisementSchema = new Schema({
  image: { type: String, required: true },
  imagekey: { type: String, required: true },
  link: { type: String, required: true },
  isDeleted: { type: Boolean, default: false }
});



const Advertisement = model('Advertisement', AdvertisementSchema);

module.exports = Advertisement;


