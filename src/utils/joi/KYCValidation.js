const Joi = require('joi');

const kycUploadSchema = Joi.object({
  sessionToken: Joi.string().trim().required(),
  documentType: Joi.string().valid('passport', 'driver_license', 'national_id').required(),
  frontImage: Joi.string().uri().required(),
  backImage: Joi.string().uri().required(),
  selfieImage: Joi.string().uri().required(),
  country: Joi.string().required()
});

const approveRejectDocValidation = Joi.object({
  documentId: Joi.string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid document ID format',
      'any.required': 'Document ID is required'
    }),
  status: Joi.string().valid('pending', "inprogress",'abandoned', 'expired',"resubmission_requested","approved").required().messages({
   
    'any.required': 'Status is required'
  }),
  rejectionReason: Joi.string().allow('').optional().messages({
    'string.base': 'Rejection reason must be a string'
  })
});

module.exports = { kycUploadSchema, approveRejectDocValidation };
