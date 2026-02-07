const Joi = require('joi');
const ReviewReportValidation = Joi.object({
    reportedBy: Joi.string()
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid reportedBy ID format'
        }),
    reviewId: Joi.string()
        .trim()
        .regex(/^[0-9a-fA-F]{24}$/)
        .messages({
            'string.pattern.base': 'Invalid reviewId format'
        }),
    reportType: Joi.string().valid('Off_topic', 'Spam', 'Conflict', 'Profanity', 'Harassment', 'Hate_speech', 'Personal_information', 'Not_helpful', 'Other').messages({
        'any.only': 'reportType must be one of the predefined categories'
    }).required()
});
module.exports = { ReviewReportValidation };
