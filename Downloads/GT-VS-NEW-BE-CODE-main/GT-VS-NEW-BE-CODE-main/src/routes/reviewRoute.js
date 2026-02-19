const express = require('express');
const {
  AddReview,
  getAllReviews,
  getReviewById,
  EditReview,
  getReviewsforService,
  DeleteReview,
  hideReview,
  getUserReviewsByVendor,
  getUserReviewsById
} = require('../controllers/reviewController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

const router = express.Router();
router
  .route('/')
  .post(
    requireAuth,
    restrictTo(['customer', 'vendor']),
    logActionMiddleware('Add Review', 'Review'),
    AddReview
  )
  .get(requireAuth, restrictTo(['customer', 'admin', 'vendor']), getAllReviews);
  router.route('/vendorbyvendor').get( requireAuth,
    restrictTo(['customer']),getUserReviewsByVendor);
      router.route('/user/:id').get( requireAuth,getUserReviewsById);
router
  .route('/:id')
  .get(getReviewById)
  .patch(
    requireAuth,
    restrictTo(['customer', 'vendor', 'admin']),
    logActionMiddleware('Edit Review', 'Review'),
    EditReview
  )
  .delete(
    requireAuth,
    restrictTo(['customer', 'admin', 'vendor']),
    logActionMiddleware('Delete Review', 'Review'),
    DeleteReview
  );
router
  .route('/hide/:id')
  .patch(
    requireAuth,
    restrictTo(['admin']),
    logActionMiddleware('Hide Review', 'Review'),
    hideReview
  );
router.route('/service/:id').get(getReviewsforService);


module.exports = router;
