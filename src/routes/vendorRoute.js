const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const { updateVendorProfile ,  stripeConnect,
      defaultPricing,
      createDefaultPricing,
      updateDefaultPricing,
      updateVendorPricing,
      getVendorsPricing,
      getVendorServices,
      updateVendorMode,

} = require('../controllers/vendorController');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');
const subAuth = require('../middlewares/subAuth');

const router = express.Router();
router.route('/').get( requireAuth, restrictTo(["admin"]), getVendorsPricing).post(requireAuth, restrictTo(["admin","vendor"]), subAuth,logActionMiddleware('Update vendor mode', 'User'),updateVendorMode);
router.route('/defaultPricing').post(requireAuth, restrictTo(["admin"]), logActionMiddleware('Create default price', 'Pricing'), createDefaultPricing).get(requireAuth, restrictTo(["admin"]), defaultPricing);
router.route('/defaultPricing/:id').patch(requireAuth, restrictTo(["admin"]), logActionMiddleware('Update price', 'Pricing'), updateDefaultPricing);
router.patch('/updateVendorProfile', requireAuth, restrictTo(["vendor"]), logActionMiddleware('Update  profile', 'User'), updateVendorProfile);
router.post('/stripeConnect', requireAuth, restrictTo(["vendor"]), logActionMiddleware('Connect to Stripe', 'User'), stripeConnect);
router.route('/:id').patch(requireAuth, restrictTo(["admin"]), logActionMiddleware('Update vendor Pricing', 'User'), updateVendorPricing).get(getVendorServices);


module.exports = router;
