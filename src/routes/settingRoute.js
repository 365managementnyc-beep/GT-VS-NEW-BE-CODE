const express = require('express');
const {
 getAllNotifications,
    updateMultipleNotifications
} = require('../controllers/settingController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

const router = express.Router();
router.route('/notification').get(requireAuth, restrictTo(["admin"]), getAllNotifications).patch(requireAuth, restrictTo(["admin"]), logActionMiddleware("Update Notification"), updateMultipleNotifications);;

module.exports = router;
