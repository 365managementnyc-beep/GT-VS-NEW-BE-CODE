const mongoose = require("mongoose");
const { Schema, model } = require('mongoose');

const NewsletterSchema = new Schema({
    email: { type: String, required: true, unique: true },
    isDeleted: { type: Boolean, default: false }
}, { toJSON: { getters: true } });

module.exports = model('Newsletter', NewsletterSchema);

