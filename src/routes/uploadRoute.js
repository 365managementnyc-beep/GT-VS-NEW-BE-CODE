const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const {
  initiateUpload,
  generatePresignedUrl,
  completeUpload,
  handleLocalChunkUpload,
  getPresignedPut,
  uploadImage,
  uploadMiddleware,
  awsStatus
} = require('../controllers/uploadController');


const router = express.Router();

console.log('[uploadRoute] routes registered: /upload-image, /presigned-put, /initiate-upload');

// AWS config status (no secrets) — for debugging
router.get('/aws-status', awsStatus);

// Direct server-side upload (most reliable — no browser-to-S3 CORS issues)
router.post('/upload-image', requireAuth, uploadMiddleware, uploadImage);

// Simple single-file upload via presigned PUT
router.post('/presigned-put', requireAuth, getPresignedPut);

// Multipart upload (for large files)
router.post('/initiate-upload', requireAuth, initiateUpload);
router.post('/generate-presigned-url', requireAuth, generatePresignedUrl);
router.post('/complete-upload', requireAuth, completeUpload);
router.put('/chunk/:uploadId/:partNumber', requireAuth, handleLocalChunkUpload);

module.exports = router;
