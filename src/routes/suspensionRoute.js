const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const {
  getAllSuspensions,
  createSuspension,
  liftSuspension,
  getUserSuspensionHistory,
  getSuspension,
  updateSuspension,
  deleteSuspension,
  expireActiveSuspensions
} = require('../controllers/suspensionController');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Admin-only routes
router.post('/', restrictTo(['admin']), createSuspension);
router.put('/lift/:suspensionId', restrictTo(['admin']), liftSuspension);
router.put('/:suspensionId', restrictTo(['admin']), updateSuspension);
router.delete('/:suspensionId', restrictTo(['admin']), deleteSuspension);
router.post('/auto-expire/run', restrictTo(['admin']), expireActiveSuspensions);

// Anyone can view
router.get('/', getAllSuspensions);
router.get('/:suspensionId', getSuspension);
router.get('/user/:userId', getUserSuspensionHistory);

module.exports = router;
