const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const {
  initiateUpload,
  generatePresignedUrl,
  completeUpload,
  handleLocalChunkUpload,
  getPresignedPut
} = require('../controllers/uploadController');


const router = express.Router();

console.log('[uploadRoute] registering routes including /presigned-put');

// Simple single-file upload via presigned PUT (recommended for profile pictures)
router.post('/presigned-put', requireAuth, getPresignedPut);

// Multipart upload (for large files)
router.post('/initiate-upload', requireAuth, initiateUpload);
router.post('/generate-presigned-url', requireAuth, generatePresignedUrl);
router.post('/complete-upload', requireAuth, completeUpload);
router.put('/chunk/:uploadId/:partNumber', requireAuth, handleLocalChunkUpload);

module.exports = router;
