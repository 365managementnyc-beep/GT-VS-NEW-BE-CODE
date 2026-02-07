const Joi = require('joi');

const disputeValidation = Joi.object({
    property: Joi.string()
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'property Id format is invalid'
        }),
    description: Joi.string().min(10).messages({
        'any.only': "description must be String",
        'any.min': "Minimum 10 character is required for description "
    }),

    status: Joi.string().valid("Pending", "Review", "Reject", "Accept").
        messages({
            'string.base': 'status must be a string'
        })
});

module.exports = { disputeValidation };
