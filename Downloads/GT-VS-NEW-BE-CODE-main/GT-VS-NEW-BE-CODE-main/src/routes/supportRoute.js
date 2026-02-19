const express = require('express');
const {
   sendContactSupportMail, getAllSupportMails 
} = require('../controllers/contactSupportMailController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

const router = express.Router();
router.route('/').post(requireAuth, restrictTo(["customer","vendor"]), logActionMiddleware("Send Contact Support Mail","ContactSupport"), sendContactSupportMail);
router.route('/').get(requireAuth, restrictTo(["customer","vendor","admin"]), getAllSupportMails);

module.exports = router;
