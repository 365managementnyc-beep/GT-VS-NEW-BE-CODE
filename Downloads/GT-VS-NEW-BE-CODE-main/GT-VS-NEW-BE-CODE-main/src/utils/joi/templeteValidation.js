const Joi = require('joi');
const { permissions } = require('../permissions');

const taskSchemaValidation = Joi.object({
    taskName: Joi.string().messages({
        'any.required': 'taskName is required',
        'string.empty': 'taskName cannot be empty',
        'string.base': 'taskName must be a string'
    }),
    description: Joi.string().messages({
        'string.base': 'description must be a string'
    })
});

const templeteValidation = Joi.object({
    templateName: Joi.string().messages({
        'any.required': 'templateName is required',
        'string.empty': 'templateName cannot be empty',
        'string.base': 'templateName must be a string'
    }),
    tabPermissions: Joi.array().min(1).items(Joi.string().valid(...permissions.subAdmin)).messages({
        'array.base': 'tabPermissions must be an array',
        'array.min': 'At least one tabPermission is required'
    })
});
const tasktempleteValidation = Joi.object({
    templateName: Joi.string().messages({
        'any.required': 'templateName is required',
        'string.empty': 'templateName cannot be empty',
        'string.base': 'templateName must be a string'
    }),
    tasks: Joi.array().items(taskSchemaValidation).messages({
        'array.base': 'tasks must be an array',
        'any.required': 'tasks are required'
    })
});

module.exports = { templeteValidation ,taskSchemaValidation,tasktempleteValidation};

