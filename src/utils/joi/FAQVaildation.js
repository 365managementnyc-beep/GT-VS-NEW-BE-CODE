const Joi = require('joi');

const FAQValidation = Joi.object({
    faqType: Joi.string().valid('landing', 'customer', 'vendor', 'service').messages({
        'any.only': 'faqType must be one of faq, training, or image',
        'string.base': 'faqType must be a string'
    }),
    dataType: Joi.string().valid('text', 'training').required().messages({
        'any.only': 'dataType must be one of text, training, or image',
        'string.base': 'dataType must be a string',
        'any.required': 'dataType is required'
    }),
    serviceId: Joi.string()
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid service Id format',
            'any.required': 'Service Id is required'
        }),
    isActive: Joi.boolean().messages({
        'any.only': 'Status must be boolean'
    }),

    // Fields for text FAQs
    question: Joi.string().messages({
        'string.base': 'Question must be a string',
        'any.required': 'Question is required'
    }),
    answer: Joi.string().messages({
        'string.base': 'Answer must be a string',
        'any.required': 'Answer is required'
    }),

    // Fields for training FAQs
    videoTitle: Joi.string().messages({
        'string.base': 'Video title must be a string',
        'any.required': 'Video title is required'
    }),
    videoLink: Joi.string().uri().messages({
        'string.uri': 'Video link must be a valid URL',
        'any.required': 'Video link is required'
    }),
    videoDescription: Joi.string().messages({
        'string.base': 'Video description must be a string',
        'any.required': 'Video description is required'
    })    

});

module.exports = { FAQValidation };

