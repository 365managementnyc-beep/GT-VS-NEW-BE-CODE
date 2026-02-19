const Joi = require('joi');

const initiateUploadSchema = Joi.object({
  fileName: Joi.string().trim().min(3).required(),
  filetype: Joi.string()
    .required()
});

const generatePresignedUrlSchema = Joi.object({
  fileName: Joi.string().trim().min(3).required(),
  uploadId: Joi.string().trim().required(),
  filetype: Joi.string()
    .required(),
  numChunks: Joi.number().integer().min(1).max(1000).required()
});

const completeUploadSchema = Joi.object({
  fileName: Joi.string().trim().min(3).required(),
  uploadId: Joi.string().trim().required()
});

module.exports = {
  initiateUploadSchema,
  generatePresignedUrlSchema,
  completeUploadSchema
};
