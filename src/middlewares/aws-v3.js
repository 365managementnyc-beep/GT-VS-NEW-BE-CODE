require('dotenv').config();
const {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  GetObjectCommand,
  ListPartsCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  GetBucketLocationCommand
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Check if AWS credentials are available
const hasAwsCredentials = () => {
  const accessKey = process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const bucket = process.env.AWS_STORAGE_BUCKET_NAME;
  
  return (
    accessKey && 
    secretKey && 
    bucket && 
    !accessKey.includes('your_') && 
    !secretKey.includes('your_') &&
    !bucket.includes('your_')
  );
};

let s3Client = null;
let _s3ClientKey = null; // track which creds the client was built with

/**
 * Return (or create) an S3Client using the CURRENT env vars.
 * Rebuilds if env vars have changed since last build (handles Render env-var updates).
 */
const getS3Client = () => {
  const accessKeyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();
  const region = (process.env.REGION || process.env.AWS_REGION || 'us-east-1').trim();
  const cacheKey = `${accessKeyId}|${region}`;

  if (!s3Client || _s3ClientKey !== cacheKey) {
    console.log('[AWS] (re)building S3Client — region:', region, '| keyId prefix:', accessKeyId.substring(0, 8), '| secret length:', secretAccessKey.length);
    s3Client = new S3Client({
      region,
      followRegionRedirects: true,
      credentials: { accessKeyId, secretAccessKey }
    });
    _s3ClientKey = cacheKey;
  }
  return s3Client;
};

// Keep a module-level alias for legacy callers that reference s3Client directly (none currently)
Object.defineProperty(exports, 's3Client', { get: getS3Client });

const bucketName = process.env.AWS_STORAGE_BUCKET_NAME;
// eslint-disable-next-line no-unused-vars
const AWSRegion = process.env.REGION;

// Cache the actual bucket region (detected on first upload)
let _resolvedBucketRegion = null;
const getBucketRegion = async () => {
  if (_resolvedBucketRegion) return _resolvedBucketRegion;
  try {
    const cmd = new GetBucketLocationCommand({ Bucket: bucketName });
    const res = await getS3Client().send(cmd);
    // us-east-1 is returned as null by AWS
    _resolvedBucketRegion = res.LocationConstraint || 'us-east-1';
    console.log('[AWS] Detected bucket region:', _resolvedBucketRegion);
  } catch (e) {
    _resolvedBucketRegion = process.env.REGION || process.env.AWS_REGION || 'us-east-1';
    console.warn('[AWS] Could not detect bucket region, using:', _resolvedBucketRegion, e.message);
  }
  return _resolvedBucketRegion;
};


const initiateMultipartUpload = async (fileName, fileType) => {
  const command = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: fileName,
    ContentType: fileType,
  });
  const response = await getS3Client().send(command);
  return { uploadId: response.UploadId };
};

const createPresignedUrl = async (fileName, uploadId, partNumber) => {
  // NOTE: Do NOT include ContentType here — it becomes a required signed header
  // and causes "SignatureDoesNotMatch" when the browser uploads the part.
  // ContentType is already set on the multipart upload itself.
  const command = new UploadPartCommand({
    Bucket: bucketName,
    Key: fileName,
    UploadId: uploadId,
    PartNumber: partNumber,
  });
  try {
    const url = await getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
    return url;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
/**
 * Upload part to S3
 */
const uploadPart = async (index, fileName, fileBuffer, uploadId, fileType) => {
  const command = new UploadPartCommand({
    Bucket: bucketName,
    Key: fileName,
    UploadId: uploadId,
    PartNumber: Number(index) + 1,
    Body: fileBuffer,
    ContentType: fileType,
  });
  return getS3Client().send(command);
};

const completeMultipartUpload = async (filename, uploadId) => {
  console.log('aya ma complete upload');

  const command = new ListPartsCommand({
    Bucket: bucketName,
    Key: filename,
    UploadId: uploadId,
  });

  try {
    const data = await getS3Client().send(command);
    console.log(data);
    if (!data) {
      throw new Error('data not provided for completing multipart upload.');
    }
    const parts = data?.Parts?.map((part) => ({
      ETag: part.ETag,
      PartNumber: part.PartNumber
    }));

    if (!parts || parts.length === 0) {
      throw new Error('No parts provided for completing multipart upload.');
    }
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: filename,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts }
    });

    const response = await getS3Client().send(completeCommand);

    return response;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const generateDownloadUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });
  return getSignedUrl(getS3Client(), command, { expiresIn: 3600 });
};

/**
 * Upload a file buffer directly to S3 from the server (no presigned URL needed).
 * Returns the permanent S3 object URL derived from the response location.
 */
const uploadFileToS3 = async (buffer, fileName, contentType) => {
  const client = getS3Client();
  const keyId = (process.env.AWS_ACCESS_KEY_ID || '').trim();
  const secret = (process.env.AWS_SECRET_ACCESS_KEY || '').trim();
  console.log('[uploadFileToS3] keyId prefix:', keyId.substring(0, 8), '| secret length:', secret.length, '| secret suffix:', secret.slice(-4));
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: buffer,
    ContentType: contentType,
  });
  await client.send(command);
  // Detect actual bucket region for correct URL
  const region = await getBucketRegion();
  return `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
};

/**
 * Generate a presigned URL for a simple single PUT upload (for small files like profile pictures).
 * Returns { uploadUrl, fileUrl } where fileUrl is the permanent S3 object URL.
 */
const getPresignedPutUrl = async (fileName, fileType) => {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    ContentType: fileType,
  });
  const uploadUrl = await getSignedUrl(getS3Client(), command, { expiresIn: 300 });
  const region = process.env.REGION || process.env.AWS_REGION || 'us-east-1';
  const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${fileName}`;
  return { uploadUrl, fileUrl };
};

const deleteMedia = async (key) => {
  
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key
    });
    const response = await getS3Client().send(command);
    console.log(`Media deleted successfully: ${key}`);
    return response;
  } catch (error) {
    console.log(`Error deleting media ${key}:`, error);
    // throw error;
  }
};

module.exports = {
  initiateMultipartUpload,
  createPresignedUrl,
  uploadPart,
  completeMultipartUpload,
  generateDownloadUrl,
  deleteMedia,
  hasAwsCredentials,
  getPresignedPutUrl,
  uploadFileToS3
};
