
const joi=require('joi');

const filterSchema=joi.object({
    serviceCategory:joi.string().trim().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
        "string.pattern.base": "Service Category ID must be a valid MongoDB ObjectId.",
        "any.required": "Service Category ID is required."
    }),
    name:joi.string().trim().required().messages({
        "string.base": "Name must be a string.",
        "any.required": "Name is required."
    }),
})

module.exports=filterSchema