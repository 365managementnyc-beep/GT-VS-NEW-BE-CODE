const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const {
  initiateUpload,
  generatePresignedUrl,
  completeUpload,
  handleLocalChunkUpload
} = require('../controllers/uploadController');


const router = express.Router();

router.post('/initiate-upload', requireAuth, initiateUpload);
router.post('/generate-presigned-url', requireAuth, generatePresignedUrl);
router.post('/complete-upload', requireAuth, completeUpload);
router.put('/chunk/:uploadId/:partNumber', requireAuth, handleLocalChunkUpload);

module.exports = router;
