const express = require('express');
const { getAllGadgets, createGadget, deleteGadget } = require('../controllers/gadgetsController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

const router = express.Router();

router
  .route('/')
  .post(requireAuth, restrictTo(['vendor', 'admin']), logActionMiddleware("Create Gadget", "ServiceGadgets"), createGadget)
  .get(requireAuth, restrictTo(['vendor', 'admin']), getAllGadgets);
router.route('/:id').delete(requireAuth, restrictTo(['vendor']), logActionMiddleware("Delete Gadget", "ServiceGadgets"), deleteGadget);

module.exports = router;
