const express = require('express');
const {createAccount} = require('../controllers/createAccountController');
// const requireAuth = require('../middlewares/requireAuth');
// const restrictTo = require('../middlewares/restrictTo');

const router = express.Router();

router.route('/').post(createAccount)


module.exports = router;
