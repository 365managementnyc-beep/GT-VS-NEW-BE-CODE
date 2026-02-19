const express = require('express');
const {
    createReportReview,
    getAllReportedReviews,
    getReportedReview,
    updateReportStatus,
    getReportsByStatus,
    getReportStatistics,
    deleteReportedReview
} = require('../controllers/reportReviewController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// User routes - Create a report for a review
router.route('/')
    .post(
        restrictTo(['customer', 'vendor']), 
        logActionMiddleware('Report Review', 'Review'), 
        createReportReview
    )
    .get(
        restrictTo(['admin']), 
        getAllReportedReviews
    );

// Admin routes - Get statistics
router.route('/statistics')
    .get(
        restrictTo(['admin']), 
        getReportStatistics
    );

// Admin routes - Get reports by status
router.route('/status/:status')
    .get(
        restrictTo(['admin']), 
        getReportsByStatus
    );

// Admin routes - Get, update, or delete specific report
router.route('/:id')
    .get(
        restrictTo(['admin']), 
        getReportedReview
    )
    .patch(
        restrictTo(['admin']), 
        logActionMiddleware('Update Report Status', 'Review'), 
        updateReportStatus
    )
    .delete(
        restrictTo(['admin']), 
        logActionMiddleware('Delete Report', 'Review'), 
        deleteReportedReview
    );

module.exports = router;
