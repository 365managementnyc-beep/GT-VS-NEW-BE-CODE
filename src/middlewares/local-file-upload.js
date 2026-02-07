const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const uploadDir = path.join(__dirname, '../../public/uploads');
const tempChunkDir = path.join(__dirname, '../../public/uploads/.chunks');

// Ensure directories exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(tempChunkDir)) {
  fs.mkdirSync(tempChunkDir, { recursive: true });
}

// Store upload metadata in memory (in production, use database or cache)
const uploadMetadata = new Map();

const localInitiateUpload = async (fileName, fileType) => {
  const uploadId = uuidv4();
  uploadMetadata.set(uploadId, {
    fileName,
    fileType,
    chunks: new Map(),
    created: Date.now()
  });
  return { uploadId, fileName };
};

const localCreatePresignedUrl = async (fileName, uploadId, partNumber, filetype) => {
  // For local uploads, we'll just return a dummy URL structure
  // In a real implementation, this would be handled differently
  return {
    uploadId,
    partNumber,
    fileName,
    url: `/api/upload/chunk/${uploadId}/${partNumber}`
  };
};

const localCompleteUpload = async (fileName, uploadId, chunks) => {
  try {
    const metadata = uploadMetadata.get(uploadId);
    if (!metadata) {
      throw new Error('Upload ID not found');
    }

    // Get chunk directory for this upload
    const uploadChunkDir = path.join(tempChunkDir, uploadId);
    
    if (!fs.existsSync(uploadChunkDir)) {
      throw new Error('No chunks found for this upload');
    }

    // Read all chunks and combine them
    const chunkFiles = fs.readdirSync(uploadChunkDir).sort((a, b) => {
      const numA = parseInt(a.split('-')[1]);
      const numB = parseInt(b.split('-')[1]);
      return numA - numB;
    });

    if (chunkFiles.length === 0) {
      throw new Error('No chunks found');
    }

    // Combine chunks into single file
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const uniqueName = `${baseName}-${uuidv4()}${ext}`;
    const filePath = path.join(uploadDir, uniqueName);

    const writeStream = fs.createWriteStream(filePath);

    for (const chunkFile of chunkFiles) {
      const chunkPath = path.join(uploadChunkDir, chunkFile);
      const chunkBuffer = fs.readFileSync(chunkPath);
      writeStream.write(chunkBuffer);
      fs.unlinkSync(chunkPath); // Remove chunk after combining
    }

    writeStream.end();

    // Wait for stream to finish
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    // Clean up chunk directory
    fs.rmdirSync(uploadChunkDir);

    const fileUrl = `/public/uploads/${uniqueName}`;
    const Key = `uploads/${uniqueName}`;

    // Clean up metadata
    uploadMetadata.delete(uploadId);

    return {
      Location: fileUrl,
      Key: Key,
      Bucket: 'local',
      success: true
    };
  } catch (error) {
    console.error('Local file upload error:', error);
    throw error;
  }
};

const localUploadChunk = async (uploadId, partNumber, fileBuffer) => {
  try {
    const metadata = uploadMetadata.get(uploadId);
    if (!metadata) {
      throw new Error('Upload ID not found');
    }

    // Create chunk directory for this upload if it doesn't exist
    const uploadChunkDir = path.join(tempChunkDir, uploadId);
    if (!fs.existsSync(uploadChunkDir)) {
      fs.mkdirSync(uploadChunkDir, { recursive: true });
    }

    // Save chunk to file
    const chunkFileName = `chunk-${partNumber}`;
    const chunkPath = path.join(uploadChunkDir, chunkFileName);
    fs.writeFileSync(chunkPath, fileBuffer);

    return {
      PartNumber: partNumber,
      ETag: `"${uuidv4()}"`,
      uploadId
    };
  } catch (error) {
    console.error('Chunk upload error:', error);
    throw error;
  }
};

module.exports = {
  localInitiateUpload,
  localCreatePresignedUrl,
  localCompleteUpload,
  localUploadChunk
};
