const {
  initiateMultipartUpload,
  createPresignedUrl,
  uploadPart,
  completeMultipartUpload,
  generateDownloadUrl,
  hasAwsCredentials,
  getPresignedPutUrl
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

// Don't load local file upload at all - it causes issues in serverless
// Lazy load local file upload only if AWS is not available
const getLocalFileUpload = () => {
  if (!useAwsUpload) {
    throw new AppError('File uploads require AWS S3 configuration in serverless environment', 500);
  }
  return null;
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
    return next(new AppError('File uploads require AWS S3 configuration', 500));
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
    return next(new AppError('File uploads require AWS S3 configuration', 500));
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

  // Local uploads not supported in serverless
  return next(new AppError('File uploads require AWS S3 configuration', 500));
  
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

const getPresignedPut = catchAsync(async (req, res, next) => {
  const { fileName, filetype } = req.body;
  if (!fileName || !filetype) {
    return next(new AppError('fileName and filetype are required', 400));
  }
  if (!useAwsUpload) {
    return next(new AppError('File uploads require AWS S3 configuration', 500));
  }
  const uniqueName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { uploadUrl, fileUrl } = await getPresignedPutUrl(uniqueName, filetype);
  return res.status(200).json({ success: true, uploadUrl, fileUrl });
});

module.exports = {
  generatePresignedUrl,
  initiateUpload,
  completeUpload,
  uploadChunk,
  handleLocalChunkUpload,
  downloadAwsObject,
  getPresignedPut
};
