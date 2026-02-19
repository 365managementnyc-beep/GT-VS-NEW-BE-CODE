const express = require('express');
const {
    createClientReview,
    getAllClientReviews,
    getClientReviewById,
    updateClientReview,
    deleteClientReview,
    getLandingPageReviews
} = require('../controllers/clientReviewController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

const router = express.Router();

// ============ PUBLIC ROUTES ============
// Get all active client reviews for landing page (no pagination)
router.get('/landing-page', getLandingPageReviews);

// Get all client reviews with pagination (for admin panel public view)
router.get('/', getAllClientReviews);

// Get single client review by ID
router.get('/:id', getClientReviewById);

// ============ ADMIN ROUTES (protected) ============
// Admin - Create client review
router.post(
    '/',
    requireAuth,
    restrictTo(['admin']),
    logActionMiddleware('Create Client Review', 'ClientReview'),
    createClientReview
);

// Admin - Update client review
router.patch(
    '/:id',
    requireAuth,
    restrictTo(['admin']),
    logActionMiddleware('Update Client Review', 'ClientReview'),
    updateClientReview
);

// Admin - Delete client review (hard delete)
router.delete(
    '/:id',
    requireAuth,
    restrictTo(['admin']),
    logActionMiddleware('Delete Client Review', 'ClientReview'),
    deleteClientReview
);

module.exports = router;
