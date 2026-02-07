const Joi = require('joi');

const taxForumValidation = Joi.object({
    businessName: Joi.string()
        .trim()
        .messages({
            'any.required': 'businessName is required'
        }),
    taxClassification: Joi.string()
        .trim()
        .messages({
            'any.required': 'taxClassification is required'
        }),
    taxId: Joi.string()
        .messages({
            'any.required': 'taxId is required'
        }),
    deliveryForm: Joi.string()
        .trim()
        .messages({
            'any.required': 'deliveryForm is required'
        }),
    taxDocument: Joi.string()
        .uri()
        .messages({
            'string.uri': 'taxDocument must be a valid URL'
        })

});

module.exports = { taxForumValidation };
