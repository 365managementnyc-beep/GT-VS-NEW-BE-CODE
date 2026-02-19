// models/Log.js
const mongoose = require('mongoose');
const { permissions } = require('../utils/permissions');

const NewsletterSettingsSchema = new mongoose.Schema({
    permission: {
        type: String,
        required: true,
        enum: permissions.newsletter
    },
    status: {
        type: Boolean,
        default: true
    },

});

module.exports = mongoose.model('NewsletterSettings', NewsletterSettingsSchema);
