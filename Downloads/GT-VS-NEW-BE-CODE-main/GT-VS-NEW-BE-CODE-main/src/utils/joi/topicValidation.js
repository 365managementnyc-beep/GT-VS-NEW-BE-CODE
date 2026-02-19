const Joi = require('joi');

const topicSchema = Joi.object({
    name: Joi.string()
        .trim()
        .messages({
            'any.required': 'name is required'
        }),
    topicType: Joi.string().valid('other', 'customer', 'vendor')
        .trim()
        .messages({
            'any.required': 'topicType is required'
        })

});


const subTopicSchema = Joi.object({
    topicId: Joi.string()
        .trim().pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
            'any.required': 'topicId is required'
        }),
    name: Joi.string()
        .trim()
        .messages({
            'any.required': 'name is required'
        }),
    title: Joi.string()
        .trim()
        .messages({
            'any.required': 'title is required'
        }),
    description: Joi.string().messages({
        'any.required': 'description is required'
    })
});

module.exports = { topicSchema, subTopicSchema };
