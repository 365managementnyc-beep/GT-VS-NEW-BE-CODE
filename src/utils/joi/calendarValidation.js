const Joi = require('joi');


const CalendarValidation = Joi.object({
    title: Joi.string(),
    start: Joi.date().greater('now').messages({
        'date.greater': 'Start date must be greater than now.'
    }),
    end: Joi.date().messages({
        'date.base': 'End date must be a valid date.',
        'any.required': 'End date is required.'
    }).greater(Joi.ref('start')).messages({
        'date.greater': 'End date must be greater than start date.'
    }),
    type: Joi.string().valid('service', 'off', 'reserved').messages({
        'any.only': 'Type must be one of the following: service, off, reserved.',
        'any.required': 'Type is required.'
    }),
    serviceId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).when('type', {
        is: 'service',
        then: Joi.required(),
        otherwise: Joi.optional()
    }),
    reason: Joi.string().messages({
        'any.required': 'Reason is required.'
    })

});


module.exports = { CalendarValidation };
