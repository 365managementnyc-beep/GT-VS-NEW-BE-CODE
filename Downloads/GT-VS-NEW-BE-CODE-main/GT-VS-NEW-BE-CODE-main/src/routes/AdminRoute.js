const express = require('express');
const requireAuth = require('../middlewares/requireAuth');
const {
    updateAdmin,
    CreateSubAdmin,
    adminDashboard,
    Resetpassword,
    exportPayoutBufferforSubAdmin
} = require('../controllers/subAdminController');
const restrictTo = require('../middlewares/restrictTo');
const { roles } = require('../utils/types');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

const router = express.Router();
router.use(requireAuth);


router.route('/').post(restrictTo(["admin"]), logActionMiddleware("Create SubAdmin", "User"), CreateSubAdmin).get(restrictTo(["admin"]), adminDashboard);
router.route('/export').get(restrictTo(["admin"]), exportPayoutBufferforSubAdmin);
router.route('/:id').patch(restrictTo(["admin"]), logActionMiddleware("Update SubAdmin", "User"), updateAdmin);
router.route('/changePassword/:userId').patch(restrictTo(["admin"]), logActionMiddleware("Update SubAdmin Password", "User"), Resetpassword);


// router.get('/getUser/:id', getUser);
module.exports = router;
