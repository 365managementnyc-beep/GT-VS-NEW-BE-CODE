const express = require('express');
const {
    getAllStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    getUserStaff
} = require('../controllers/staffController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');
const router = express.Router();
router.route('/').post(requireAuth, restrictTo(["customer","vendor","admin"]), logActionMiddleware("Add Staff", "Staff"), createStaff).get(requireAuth, restrictTo(["customer","vendor","admin"]), getUserStaff);
router.route('/:id').patch(requireAuth, restrictTo(["customer","vendor","admin"]), logActionMiddleware("Edit Staff", "Staff"), updateStaff).delete(requireAuth, restrictTo(["customer","vendor","admin"]), logActionMiddleware("Delete Staff", "Staff"), deleteStaff).get(requireAuth, restrictTo(["admin","customer", "vendor"]), getAllStaff);


module.exports = router;
