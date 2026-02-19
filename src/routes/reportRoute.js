const express = require('express');
const {
    getReportForVendor,
    customerDashboard,
    vendorDashboard,
    adminDashboard,
    getReportForAdmin,
    monthlyvendorStats
} = require('../controllers/reportanalyticsController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const router = express.Router();
router.route('/vendor').get(requireAuth, restrictTo(['admin',"vendor"]), getReportForVendor);
router.route('/vendor/:id').get(requireAuth, restrictTo(['admin']), monthlyvendorStats);
router.route('/customerdashboard').get(requireAuth, restrictTo(['admin', "customer"]), customerDashboard);
router.route('/vendordashboard').get(requireAuth, restrictTo(['admin', "vendor"]), vendorDashboard);
router.route('/admindashboard').get(requireAuth, restrictTo(['admin']), adminDashboard);
router.route('/admin').get(requireAuth, restrictTo(['admin']), getReportForAdmin);
module.exports = router;