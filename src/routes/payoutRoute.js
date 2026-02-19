const express = require('express');
const {
    getAllPayoutsForAdmin, 
    getAllPayoutsForCustomer,
    exportPayoutBuffer
} = require('../controllers/payoutController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
    

const router = express.Router();
router.route('/').get(requireAuth, restrictTo(["admin","customer"]), getAllPayoutsForAdmin)
router.route('/customer').get(requireAuth, restrictTo(["customer"]), getAllPayoutsForCustomer)
router.route('/downloadfile').get(requireAuth, restrictTo(["admin", "customer"]), exportPayoutBuffer);


module.exports = router;
