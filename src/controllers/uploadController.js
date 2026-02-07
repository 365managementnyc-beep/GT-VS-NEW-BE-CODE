const {
  initiateMultipartUpload,
  createPresignedUrl,
  uploadPart,
  completeMultipartUpload,
  generateDownloadUrl,
  hasAwsCredentials
} = require('../middlewares/aws-v3');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const {
  initiateUploadSchema,
  generatePresignedUrlSchema,
  completeUploadSchema
} = require('../utils/joi/fileUploadValidations');

// Determine if we should use AWS or local upload
const useAwsUpload = hasAwsCredentials();

// Lazy load local file upload only if needed
let localFileUpload = null;
const getLocalFileUpload = () => {
  if (!localFileUpload) {
    localFileUpload = require('../middlewares/local-file-upload');
  }
  return localFileUpload;
};

const initiateUpload = catchAsync(async (req, res, next) => {
  const { error } = initiateUploadSchema.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    const errorFields = error.details.reduce((acc, err) => {
      acc[err.context.key] = err.message.replace(/['"]/g, '');
      return acc;
    }, {});

    return next(new AppError('Validation failed', 400, { errorFields }));
  }
  const { fileName, filetype } = req.body;
  console.log('files coming', req.body);

  let response;
  if (useAwsUpload) {
    response = await initiateMultipartUpload(fileName, filetype);
  } else {
    const { localInitiateUpload } = getLocalFileUpload();
    response = await localInitiateUpload(fileName, filetype);
  }
  
  return res.status(200).json({ success: true, response, uploadMode: useAwsUpload ? 'aws' : 'local' });
});

const generatePresignedUrl = catchAsync(async (req, res, next) => {
  const { error } = generatePresignedUrlSchema.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    const errorFields = error.details.reduce((acc, err) => {
      acc[err.context.key] = err.message.replace(/['"]/g, '');
      return acc;
    }, {});

    return next(new AppError('Validation failed', 400, { errorFields }));
  }
  const { fileName, uploadId, filetype, numChunks } = req.body;

  console.log('pre signed body', req.body);

  let urls;
  if (useAwsUpload) {
    urls = await Promise.all(
      Array.from({ length: numChunks }, (_, i) =>
        createPresignedUrl(fileName, uploadId, i + 1, filetype)
      )
    );
  } else {
    // For local uploads, return local upload endpoints
    urls = Array.from({ length: numChunks }, (_, i) => 
      `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/upload/chunk/${uploadId}/${i + 1}`
    );
  }

  return res.status(200).json({ success: true, urls });
});

const completeUpload = catchAsync(async (req, res, next) => {
  const { error } = completeUploadSchema.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    const errorFields = error.details.reduce((acc, err) => {
      acc[err.context.key] = err.message.replace(/['"]/g, '');
      return acc;
    }, {});

    return next(new AppError('Validation failed', 400, { errorFields }));
  }

  const { fileName, uploadId } = req.body;

  let response;
  if (useAwsUpload) {
    response = await completeMultipartUpload(fileName, uploadId);
  } else {
    const { localCompleteUpload } = getLocalFileUpload();
    response = await localCompleteUpload(fileName, uploadId, Buffer.alloc(0));
  }

  return res.status(200).json({
    success: true,
    message: 'Upload completed successfully',
    data: response,
    uploadMode: useAwsUpload ? 'aws' : 'local'
  });
});

const uploadChunk = catchAsync(async (req, res, next) => {
  const { index, fileName, filetype } = req.body;
  const { uploadId } = req.query;
  const { file } = req;
  if (!index || !fileName || !uploadId || !file) {
    return next(new AppError('Missing required parameters.', 400));
  }

  if (useAwsUpload) {
    const response = await uploadPart(index, fileName, file.buffer, uploadId, filetype);
    return res.status(200).json({
      success: true,
      message: 'Chunk uploaded successfully',
      data: response
    });
  } else {
    return res.status(200).json({
      success: true,
      message: 'Chunk received successfully',
      data: { uploadId, partNumber: index }
    });
  }
});

const handleLocalChunkUpload = catchAsync(async (req, res, next) => {
  const { uploadId, partNumber } = req.params;

  if (!uploadId || !partNumber) {
    return next(new AppError('Missing uploadId or partNumber.', 400));
  }

  // The chunk data comes as raw binary in the request body
  const chunkBuffer = req.body;

  if (!chunkBuffer || chunkBuffer.length === 0) {
    return next(new AppError('No chunk data received.', 400));
  }

  // Store chunk temporarily on disk
  const { localUploadChunk } = getLocalFileUpload();
  const response = await localUploadChunk(uploadId, parseInt(partNumber), chunkBuffer);
  
  return res.status(200).json({
    success: true,
    message: 'Chunk uploaded successfully',
    data: response
  });
});

const downloadAwsObject = catchAsync(async (req, res, next) => {
  const { key } = req.body;

  if (!key) {
    return next(new AppError('File key is required.', 400));
  }

  const url = await generateDownloadUrl(key);
  return res.status(200).json({ success: true, url });
});

module.exports = {
  generatePresignedUrl,
  initiateUpload,
  completeUpload,
  uploadChunk,
  handleLocalChunkUpload,
  downloadAwsObject
};
