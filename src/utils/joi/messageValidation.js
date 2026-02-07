const Joi = require("joi");

const messageValidationSchema = Joi.object({

    bookingId: Joi.string()
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/),
 
    contentTitle: Joi.string().allow(null, ''),
    receiverId: Joi.string()
        .trim(),
    fileSize: Joi.string().allow(null, ''),
    content: Joi.string().when('sharedContact', {
        is: false,
        then: Joi.string().required()
    }).when('sharedLocation', {
        is: false,
        then: Joi.string().required()
    }),
    contentDescription: Joi.string().allow(null, ''),
    contentDescriptionType: Joi.string().valid('text', 'link').default('text'),
    contentType: Joi.string().valid('text', 'image', 'video', 'file', 'audio', 'contact', 'link').default('text'),

});
