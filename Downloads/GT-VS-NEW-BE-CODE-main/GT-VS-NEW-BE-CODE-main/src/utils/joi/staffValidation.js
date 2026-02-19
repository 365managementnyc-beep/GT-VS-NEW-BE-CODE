const Joi = require('joi');

const StaffSchema = Joi.object({
    firstName: Joi.string().trim().messages({
        'string.base': 'First name must be a string.',
        'any.required': 'First name is required.'
    }),
    lastName: Joi.string().trim().messages({
        'string.base': 'Last name must be a string.',
        'any.required': 'Last name is required.'
    }),
    email: Joi.string().email().trim().messages({
        'string.email': 'Email must be a valid email.',
        'any.required': 'Email is required.'
    }),
    contact: Joi.string().messages({
        'string.base': 'Contact must be a string.'
    }),
    countryCode: Joi.string().trim().messages({
        'string.base': 'Country code must be a string.'
    }),

    permissions: Joi.array().items(Joi.string()).messages({
        'array.base': 'Permissions must be an array of strings.'
    }),
    password: Joi.string().min(6).messages({
        'string.min': 'Password must be at least 6 characters long.'
    }),
    staffRole: Joi.string().trim().messages({
        'string.base': 'Staff role must be a string.'
    })
});

module.exports = StaffSchema;
