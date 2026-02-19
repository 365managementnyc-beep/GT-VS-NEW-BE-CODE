const Joi = require('joi');

const ClientReviewValidation = Joi.object({
    rating: Joi.number()
        .min(1)
        .max(5)
        .messages({
            'number.base': 'Rating must be a number',
            'number.min': 'Rating must be at least 1',
            'number.max': 'Rating cannot exceed 5',
            'any.required': 'Rating is required'
        }),
    description: Joi.string()
        .trim()
        .max(1000)
        .messages({
            'string.base': 'Description must be a string',
            'string.max': 'Description cannot exceed 1000 characters',
            'string.empty': 'Description cannot be empty',
            'any.required': 'Description is required'
        }),
    clientName: Joi.string()
        .trim()
        .max(100)
        .messages({
            'string.base': 'Client name must be a string',
            'string.max': 'Client name cannot exceed 100 characters',
            'string.empty': 'Client name cannot be empty',
            'any.required': 'Client name is required'
        }),
    imageKey: Joi.string()
        .allow('', null)
        .messages({
            'string.base': 'Image key must be a string'
        }),
    imageUrl: Joi.string()
        .allow('', null)
        .uri()
        .messages({
            'string.base': 'Image URL must be a string',
            'string.uri': 'Image URL must be a valid URL'
        }),
    isActive: Joi.boolean()
        .messages({
            'boolean.base': 'isActive must be a boolean'
        })
});

module.exports = {
    ClientReviewValidation
};
