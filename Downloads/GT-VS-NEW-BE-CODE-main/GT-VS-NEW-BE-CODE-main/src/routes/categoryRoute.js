const express = require('express');
const {
  getAllCategories,
  createCateGory,
  deleteCatagory,
  updateCategory

} = require('../controllers/serviceCatagoryController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

const router = express.Router();

router
  .route('/')
  .post(requireAuth, restrictTo(['vendor','admin']), logActionMiddleware("Create Service Category","ServiceCategory"), createCateGory)
  .get(getAllCategories);
router.route('/:id').delete(deleteCatagory).patch(requireAuth, restrictTo(['vendor','admin']), logActionMiddleware("Update Service Category","ServiceCategory"), updateCategory);

module.exports = router;
