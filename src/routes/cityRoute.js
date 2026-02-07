const express = require('express');
const { 
    getAllCities,
    createCity,
    deleteCity,
    updateCity,
    getCitiesNames
} = require('../controllers/cityController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');


const router = express.Router();

router
  .route('/')
  .post(requireAuth, restrictTo(['admin']), logActionMiddleware("Create City", "City"), createCity)
  .get(requireAuth, restrictTo(['admin']), getAllCities); // corrected from vendor to admin
router.route("/getCitiesNames").get(getCitiesNames)
router.route('/:id')
  .delete(requireAuth, restrictTo(['admin']), logActionMiddleware("Delete City", "City"), deleteCity) // added logActionMiddleware
  .patch(requireAuth, restrictTo(['admin']), logActionMiddleware("Update City", "City"), updateCity); // added logActionMiddleware


 



module.exports = router;