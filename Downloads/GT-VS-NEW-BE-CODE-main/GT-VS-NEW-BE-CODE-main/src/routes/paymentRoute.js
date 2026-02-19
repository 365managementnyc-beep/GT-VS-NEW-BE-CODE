const express = require('express');
const {
    getAllpaymentsforVendor,
    getAllPayments,
    vendorPayout,
    getsinglecompletedbooking
} = require('../controllers/paymentController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const router = express.Router();


router.route('/').get(requireAuth, restrictTo(['admin']), getAllPayments);
router.route('/vendor').get(requireAuth, restrictTo(['admin', 'vendor']), getAllpaymentsforVendor).post(requireAuth, restrictTo(['admin']), vendorPayout);
router.route('/:bookingId').get(requireAuth, restrictTo(['admin', 'vendor']), getsinglecompletedbooking);
module.exports = router;