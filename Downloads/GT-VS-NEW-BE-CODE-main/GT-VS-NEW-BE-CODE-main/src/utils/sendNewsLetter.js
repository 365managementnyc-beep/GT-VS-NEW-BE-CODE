const NewsletterSettings = require("../models/NewLetterPermission");
const Newsletter = require("../models/Newsletter");
const Email = require("./email");

const sendMailtoSuscribers = async (permission, message) => {

    const findPermission = await NewsletterSettings.findOne({ permission: permission, status: true });
    console.log('findPermission:', findPermission);
    if (findPermission.status === true) {
        const findSuscribers = await Newsletter.find({ isDeleted: false });
        console.log('findSuscribers:', findSuscribers);
        if (findSuscribers.length === 0) {
            console.log('No subscribers found');
            return;
        }
        const emails = findSuscribers.map((subscriber) => subscriber.email);
        const email = new Email(emails, message);
        const result = await email.sendTextEmail("Newsletter", message);
        console.log('Sending email to:', result);
    }




























































    return
};

module.exports = { sendMailtoSuscribers };