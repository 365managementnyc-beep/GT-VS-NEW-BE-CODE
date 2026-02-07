const Joi = require('joi');

const eventTypeSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long.',
    'string.max': 'Name must be at most 100 characters long.',
    'any.required': 'Name is required.'
  })
});

module.exports = { eventTypeSchema };
