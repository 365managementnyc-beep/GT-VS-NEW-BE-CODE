require('dotenv').config();
const {
  S3Client,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  GetObjectCommand,
  ListPartsCommand,
  DeleteObjectCommand,
  PutObjectCommand
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

// Only initialize S3Client if credentials are available
if (hasAwsCredentials()) {
  const region = process.env.REGION || process.env.AWS_REGION || 'us-east-1';
  console.log('[AWS] Initializing S3Client with region:', region);
  console.log('[AWS] Bucket:', process.env.AWS_STORAGE_BUCKET_NAME);
  console.log('[AWS] Access Key ID (first 8 chars):', (process.env.AWS_ACCESS_KEY_ID || '').substring(0, 8));
  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID.trim(),
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY.trim()
    }
  });
}

const bucketName = process.env.AWS_STORAGE_BUCKET_NAME;
// eslint-disable-next-line no-unused-vars
const AWSRegion = process.env.REGION;


const initiateMultipartUpload = async (fileName, fileType) => {
  const command = new CreateMultipartUploadCommand({
    Bucket: bucketName,
    Key: fileName,
    ContentType: fileType,
  });
  const response = await s3Client.send(command);
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
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
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
  return s3Client.send(command);
};

const completeMultipartUpload = async (filename, uploadId) => {
  console.log('aya ma complete upload');

  const command = new ListPartsCommand({
    Bucket: bucketName,
    Key: filename,
    UploadId: uploadId,
  });

  try {
    const data = await s3Client.send(command);
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

    const response = await s3Client.send(completeCommand);

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
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
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
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
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
    const response = await s3Client.send(command);
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
  getPresignedPutUrl
};
