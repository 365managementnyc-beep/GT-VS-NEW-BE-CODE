const Joi = require('joi');

const advertisementSchema = Joi.object({
  image: Joi.string().uri().messages({
    'string.uri': 'Image must be a valid URL',
    'any.required': 'Image is required'
  }),
  imagekey: Joi.string().messages({
    
    'any.required': 'Image key is required'
  }),
  link: Joi.string().uri().messages({
    'string.uri': 'Link must be a valid URL',
    'any.required': 'Link is required'
  })

});



module.exports = { advertisementSchema };
