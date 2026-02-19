const Joi = require('joi');


const ReviewValidation = Joi.object({
    rating: Joi.number().min(1).max(5),
    comment: Joi.string().min(10),
    reviewType: Joi.string().valid('positive', 'negative').messages({
        'any.only': 'reviewType must be either positive or negative'
    }),
    reviewOn: Joi.string()
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid reviewOn ID format'
        })
});

module.exports = { ReviewValidation };
