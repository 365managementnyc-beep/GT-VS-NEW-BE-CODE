const express = require('express');
const {
    createTopic,
    getTopic,
    getAllTopics,
    updateTopic,
    deleteTopic,
    createSubtopic,
    updateSubtopic,
    deleteSubtopic
} = require('../controllers/topicController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

const router = express.Router();
router.route('/').post(requireAuth, restrictTo(['admin']), logActionMiddleware('Create Topic', 'Topic'), createTopic).get(getAllTopics);
router.route('/subtopic').post(requireAuth, restrictTo(['admin']), logActionMiddleware('Create Subtopic', 'Subtopic'), createSubtopic).patch(requireAuth, restrictTo(['admin']), logActionMiddleware('Update Subtopic', 'Subtopic'), updateSubtopic).delete(requireAuth, restrictTo(['admin']), logActionMiddleware('Delete Subtopic', 'Subtopic'), deleteSubtopic);
router.route('/:id').get(requireAuth, restrictTo(['admin']), getTopic).patch(requireAuth, restrictTo(['admin']), logActionMiddleware('Update Topic', 'Topic'), updateTopic).delete(requireAuth, restrictTo(['admin']), logActionMiddleware('Delete Topic', 'Topic'), deleteTopic);
router.route('/subtopic/:id').patch(requireAuth, restrictTo(['admin']), logActionMiddleware('Update Subtopic', 'Subtopic'), updateSubtopic).delete(requireAuth, restrictTo(['admin']), logActionMiddleware('Delete Subtopic', 'Subtopic'), deleteSubtopic);

module.exports = router;
