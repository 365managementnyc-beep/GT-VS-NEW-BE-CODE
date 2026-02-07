const express = require('express');
const {  getAllFaqs,
  createFaq,
  deleteFaq ,
    updateFaq,
    getAllFaqswithoutId
} = require('../controllers/faqController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');


const router = express.Router();

router
  .route('/')
  .post(requireAuth, restrictTo(['vendor', "admin"]),logActionMiddleware("create Faq","Faq"),createFaq).get(getAllFaqswithoutId)
 router.route('/:id')
  .get(requireAuth, restrictTo(['vendor', "admin"]), getAllFaqs)
  .delete(requireAuth, restrictTo(['vendor', "admin"]),logActionMiddleware("delete Faq","Faq"), deleteFaq).patch(requireAuth, restrictTo(['vendor', "admin"]),logActionMiddleware("update Faq","Faq"),updateFaq);

module.exports = router;