const express = require('express');
const { 
    createTaxForum,
    getTaxForum,
    getAllTaxForum,
    updateTaxForum,
    deleteTaxForum,
    VerifyTaxForum
 } = require('../controllers/taxForumController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

const router = express.Router();

router.route('/').post(requireAuth,restrictTo(["vendor"]),logActionMiddleware("Submit Tax Forum","TaxForum"),createTaxForum).get(requireAuth,restrictTo(["admin"]),getAllTaxForum);
router.route('/:id').get(getTaxForum).patch(requireAuth,restrictTo(["vendor","admin"]),logActionMiddleware("Update Tax Forum","TaxForum"),updateTaxForum).delete(requireAuth,restrictTo(["vendor","admin"]),logActionMiddleware("Delete Tax Forum","TaxForum"),deleteTaxForum);
router.route('/verify/:id').patch(requireAuth,restrictTo(["admin"]),logActionMiddleware("Verify Tax Forum","TaxForum"),VerifyTaxForum)

module.exports = router;
