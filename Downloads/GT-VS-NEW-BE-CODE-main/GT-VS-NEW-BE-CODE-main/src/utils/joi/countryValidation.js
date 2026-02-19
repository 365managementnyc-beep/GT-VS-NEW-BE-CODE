const Joi = require('joi');

const CountryValidation = Joi.object({
    country: Joi.string().messages({
        'string.base': 'country must be a string',
        'any.required': 'country is required'
    }),
    region: Joi.string().trim().messages({
        'string.base': 'region must be a string',
        'any.required': 'region is optional'
    }),
    currency: Joi.string().trim().messages({
        'string.base': 'Currency must be a string',
        'any.required': 'Currency is optional'
    }),
    latlng: Joi.array().items(Joi.number()).min(2).max(2).messages({
        'array.base': 'latlng must be an array of numbers',
        'array.min': 'latlng must contain at least 2 items',
        'array.max': 'latlng must contain at most 2 items',
        'any.required': 'latlng is optional'
    }),
    status: Joi.string().valid('Active', 'Inactive').messages({
        'string.base': 'status must be a string',
        'any.only': 'status must be either Active or Inactive',
        'any.required': 'status is optional'
    })
});
const CityValidation = Joi.object({
    country: Joi.string().messages({
        'string.base': 'country must be a string',
        'any.required': 'country is required'
    }),
    city: Joi.string().messages({
        'string.base': 'city must be a string',
        'any.required': 'city is required'
    }),
    province: Joi.string().trim().messages({
        'string.base': 'province must be a string',
        'any.required': 'province is optional'
    }),
    countrylatlng: Joi.array().items(Joi.number()).min(2).max(2).messages({
        'array.base': 'countrylatlng must be an array of numbers',
        'array.min': 'countrylatlng must contain at least 2 items',
        'array.max': 'countrylatlng must contain at most 2 items',
        'any.required': 'countrylatlng is optional'
    }),
    citylatlng: Joi.array().items(Joi.number()).min(2).max(2).messages({
        'array.base': 'citylatlng must be an array of numbers',
        'array.min': 'citylatlng must contain at least 2 items',
        'array.max': 'citylatlng must contain at most 2 items',
        'any.required': 'citylatlng is optional'
    }),
    provincelatlng: Joi.array().items(Joi.number()).min(2).max(2).messages({
        'array.base': 'provincelatlng must be an array of numbers',
        'array.min': 'provincelatlng must contain at least 2 items',
        'array.max': 'provincelatlng must contain at most 2 items',
        'any.required': 'provincelatlng is optional'
    }),
    status: Joi.string().valid('Active', 'Inactive').messages({
        'string.base': 'status must be a string',
        'any.only': 'status must be either Active or Inactive',
        'any.required': 'status is optional'
    })
});

module.exports = { CountryValidation,CityValidation };

