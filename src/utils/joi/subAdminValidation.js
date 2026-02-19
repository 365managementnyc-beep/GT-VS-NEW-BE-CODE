const Joi = require('joi');

  const Adminschema = Joi.object({
    firstName: Joi.string()
      .trim()
      .min(2)
      .max(50),
    lastName: Joi.string()
      .trim()
      .min(2)
      .max(50),
    email: Joi.string()
      .trim()
      .email()
      .messages({
        'string.email': 'Invalid email format',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .trim()
      .min(8)
      .messages({
        'string.empty': 'Password is required',
        'any.required': 'Password is required',
        'string.min': 'Password must be at least 8 characters long'
      }),
      profilePicture: Joi.string()
      .trim()
      .uri(),
      
    templateId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
      'string.pattern.base': 'Invalid template ID format',
      'any.required': 'Template ID is required'
    }),
    tasks: Joi.array().min(1)
      .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/).messages({
        'string.pattern.base': 'Invalid task ID format',
        'any.required': 'Task ID is required',
        'array.min': 'At least one task ID is required'
      }))
  })
  .messages({
    'object.unknown': 'Invalid field(s) provided',
    'object.base': 'Invalid data format'
  });
module.exports = { Adminschema };
