const express = require('express');
const { getAllAdvertisement,
    createAdvertisement,
    deleteAdvertisement,
    updateAdvertisement} = require('../controllers/advertisementController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

const router = express.Router();

router.route('/').post(requireAuth,restrictTo(["admin"]),logActionMiddleware("Create Ad","Advertisement"),createAdvertisement).get(getAllAdvertisement);
router.route('/:id').patch(requireAuth,restrictTo(["admin"]),logActionMiddleware("Edit Ad","Advertisement"),updateAdvertisement).delete(requireAuth, restrictTo(["admin"]),logActionMiddleware("Delete Ad","Advertisement"), deleteAdvertisement);

module.exports = router;
