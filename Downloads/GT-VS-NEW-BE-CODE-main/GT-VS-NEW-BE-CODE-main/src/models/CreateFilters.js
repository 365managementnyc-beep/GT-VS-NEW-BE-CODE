
const mongoose = require("mongoose");
const { Schema, model } = require('mongoose');

const filterSchema = new Schema({
    serviceCategory: {
        type: Schema.Types.ObjectId,
        ref: "ServiceCategory",
        required: true
    },
    name: {
        type: String,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { toJSON: { getters: true } });

module.exports = model('Filter', filterSchema);