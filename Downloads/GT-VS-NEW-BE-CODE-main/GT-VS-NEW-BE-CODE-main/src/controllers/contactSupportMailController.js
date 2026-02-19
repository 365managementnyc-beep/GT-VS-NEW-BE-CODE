
const Email = require('../utils/email');
const ContactSupportEmail = require('../models/ContactSupportEmail');
const catchAsync = require('../utils/catchAsync');

const sendContactSupportMail = catchAsync(async (req, res, next) => {
    const { message } = req.body;
    const { fullName, email } = req.user;
    const adminEmail = process.env.NOTIFICATION_EMAIL || 'admin@example.com';
    const subject = 'Contact Support Request';
    // HTML template (can be replaced with EJS)
    const htmlBody = `
        <h2>Support Request</h2>
        <p><strong>From:</strong> ${fullName} (${email})</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
    `;
    await new Email(adminEmail, fullName).sendHtmlEmail(subject, htmlBody);
    // Store email history
    await ContactSupportEmail.create({
        userId: req.user._id,
        userEmail: email,
        userName: fullName,
        message,
        adminEmail,
        status: 'sent'
    });
    res.locals.dataId = req.user._id;
    return res.status(200).json({
        status: 'success',
        message: 'Your support request has been sent to the admin.'
    });
});

const getAllSupportMails = catchAsync(async (req, res, next) => {
    const userId = req.user._id;
    const mails = await ContactSupportEmail.find({ userId }).sort({ sentAt: -1 });
    return res.status(200).json({
        status: 'success',
        results: mails.length,
        data: mails
    });
});

module.exports = { sendContactSupportMail, getAllSupportMails };
