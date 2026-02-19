const express = require('express');
const {  
  createDiscount,
  getAllDiscounts,
  getDiscount,
  updateDiscount,
  verifyDiscount,
  deleteDiscount,
  getdiscountForVendor
} = require('../controllers/discountController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

const router = express.Router();

router
  .route('/')
  .post(
    requireAuth,
    restrictTo(['admin', "vendor"]),
    logActionMiddleware("Create promo code", "Discount"),
    createDiscount
  )
  .get(
    requireAuth,
    getAllDiscounts
  );

router
  .route('/getdiscountForVendor')
  .get(
    requireAuth,
    restrictTo(['admin',"vendor"]),
    getdiscountForVendor
  );
  router
  .route('/verifyDiscount')
  .post(
    requireAuth,
    restrictTo(['admin', "vendor","customer"]),
    logActionMiddleware("Verify promo code", "Discount"),
    verifyDiscount
  );

router
  .route('/:id')
  .get(
    requireAuth,
    restrictTo(['admin',"vendor"]),
    getDiscount
  )
  .patch(
    requireAuth,
    restrictTo(['admin',"vendor"]),
    logActionMiddleware("Update promo code", "Discount"),
    updateDiscount
  )
  .delete(
    requireAuth,
    restrictTo(['admin',"vendor"]),
    logActionMiddleware("Delete promo code", "Discount"),
    deleteDiscount
  );



module.exports = router;
