const express = require('express');
const {
    createDispute,
    updateDispute,
    updateStatus,
    getAllDisputeForAdmin,
    getAllDisputeOfUser,
    deleteDispute,
    getProperties,
    getSingleDisputeById,
    getSingleDisputeForuser
} = require('../controllers/disputeController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

const router = express.Router();

router
    .route('/')
    .post(requireAuth, restrictTo(['vendor', 'customer']), logActionMiddleware("Create Dispute","Dispute"),createDispute)
    .get(requireAuth, restrictTo(['vendor', 'customer']), getAllDisputeOfUser);
router
    .route('/admindisputes')
    .get(requireAuth, restrictTo(['admin']), getAllDisputeForAdmin);
router.route("/properties").get(requireAuth, restrictTo(['admin', 'vendor', 'customer']), getProperties)
router.route('/updatestatus/:id').patch(requireAuth, restrictTo(['admin']), logActionMiddleware("Update Dispute status","Dispute"),updateStatus).get(requireAuth, restrictTo(['admin']), getSingleDisputeById)
router.route('/:id').delete(requireAuth, restrictTo(['vendor', 'customer']),logActionMiddleware("Delete Dispute","Dispute"), deleteDispute).patch(requireAuth, restrictTo(['vendor', 'customer']), logActionMiddleware("Update Dispute","Dispute"), updateDispute).get(requireAuth, getSingleDisputeForuser)

module.exports = router;
