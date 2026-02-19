const express = require('express');
const {
   createEventType,
    getAllEventTypes,
    deleteEventType,
    updateEventType,
    getNamesforDropdown
} = require('../controllers/eventTypeController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');


const router = express.Router();

router
  .route('/')
  .post(requireAuth, restrictTo(["admin"]), logActionMiddleware("create Event Type", "EventType"), createEventType).get(getAllEventTypes)
router.route('/:id')
  .get(requireAuth, restrictTo(["admin"]), getAllEventTypes)
  .delete(requireAuth, restrictTo(["admin"]),logActionMiddleware("delete Event Type","EventType"), deleteEventType).patch(requireAuth, restrictTo(["admin"]),logActionMiddleware("update Event Type","EventType"),updateEventType);
router.route('/dropdown/names').get(getNamesforDropdown);

module.exports = router;