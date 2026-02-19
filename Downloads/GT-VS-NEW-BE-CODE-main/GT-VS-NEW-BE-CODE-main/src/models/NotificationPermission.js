// models/NotificationSetting.js
const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['new_venue',  'venue_feedback', "venue_cancellation","customer_support","service_like","TaxForum","payout", 'inbox' ],
        required: true
    },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    mobile: { type: Boolean, default: false },
    admin: { type: Boolean, default: false },
    subadmin: { type: Boolean, default: false }
    
}, { timestamps: true });

module.exports = mongoose.model('NotificationSetting', settingSchema);
