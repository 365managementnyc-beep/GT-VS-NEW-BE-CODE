const express = require('express');
const {
  getAlertNotifications,
  createServiceReportAlert
} = require('../controllers/alertController');
const requireAuth = require('../middlewares/requireAuth');

const router = express.Router();

// Get all alert notifications with pagination (latest first)
router.get('/', requireAuth, getAlertNotifications);

// Create and send alert notification to admin for a service report
router.post('/service-report', requireAuth, createServiceReportAlert);

module.exports = router;
