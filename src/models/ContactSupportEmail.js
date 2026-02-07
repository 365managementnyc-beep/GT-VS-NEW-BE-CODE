const mongoose = require('mongoose');

const ContactSupportEmailSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String, required: true },
    userName: { type: String },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    adminEmail: { type: String, required: true },
    status: { type: String, default: 'sent' },
    response: { type: String },
});

module.exports = mongoose.model('ContactSupportEmail', ContactSupportEmailSchema);
