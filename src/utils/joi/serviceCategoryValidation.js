const Joi = require('joi');

const serviceCategorySchema = Joi.object({
    name: Joi.string().trim().messages({
        'any.required': 'Name is required.',
        'string.base': 'Name must be a string.'
    }),
    blackIcon: Joi.string().trim().uri().messages({
        'string.base': 'blackIcon must be a string.'
    }),
    whiteIcon: Joi.string().trim().uri().messages({
        'string.base': 'whiteIcon must be a string.'
    }),
    whiteKey: Joi.string().trim().messages({
        'string.base': 'whitekey must be a string.'
    }),
    blackKey: Joi.string().trim().messages({
        'string.base': 'blackKey must be a string.'
    })
});

module.exports = serviceCategorySchema;
