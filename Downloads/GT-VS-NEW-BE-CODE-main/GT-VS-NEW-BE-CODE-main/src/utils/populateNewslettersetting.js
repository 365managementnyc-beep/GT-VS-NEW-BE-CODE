const Newsletter = require('../models/NewLetterPermission');
const { permissions } = require('./permissions');



const populateNewsLetter = async () => {
    await Newsletter.deleteMany({});
    console.log('Existing Services deleted.');
    const newsletterSettings = permissions.newsletter.map((permission) => {
        return {
            permission: permission,
            status: true,
        };
    });
    

    await Newsletter.insertMany(newsletterSettings);
    console.log('Services added successfully!');
};

module.exports = populateNewsLetter;


