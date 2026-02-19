const express = require('express');
const { 
    createFilter,
    getAllfilterbyID,
    deleteFilter, 
    updatedFilter
} = require('../controllers/filterController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');

const router = express.Router();

router
    .route('/')
    .post(requireAuth, restrictTo(['admin']), logActionMiddleware("Create Filter", "Filter"), createFilter)
router.route('/:id').delete(requireAuth, restrictTo(['vendor', "admin"]), logActionMiddleware("Delete Filter", "Filter"), deleteFilter).get(getAllfilterbyID).patch(requireAuth, restrictTo(['admin']), logActionMiddleware("Update Filter", "Filter"), updatedFilter);

module.exports = router;
