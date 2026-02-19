const mongoose = require("mongoose");
const { Schema, model } = require('mongoose');

const CalendarSchema = new Schema({
    title: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    type: {
        type: String,
        enum: ["off", "reserved"],
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: function () {
            return  this.type === "off" || this.type === "reserved";
        }
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ServiceListing",
        required: function () {
            return this.type === "reserved";
        }
    },
    reason: {
        type: String,
        required: function () {
            return this.type === "off" || this.type === "reserved";
        }
    }

}, { toJSON: { getters: true } });

module.exports = model('Calendar', CalendarSchema);

