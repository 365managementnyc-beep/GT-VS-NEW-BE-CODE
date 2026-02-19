const express = require('express');
const {
    createNewsletter,
    getAllNewsletters,
    deleteNewsletter, sendNewsletter,
    eitpermissionforNewsletter,
    getNewsletterSettings
} = require('../controllers/newsletterController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');



const router = express.Router();
router.route('/').post(createNewsletter)
router.use(requireAuth);
router.use(restrictTo(['admin']));
router.route('/').get(getAllNewsletters);
router.route('/settings').get(getNewsletterSettings).patch(eitpermissionforNewsletter);;
router.route('/send').post(sendNewsletter);
router.route('/:id').delete(deleteNewsletter);


module.exports = router;