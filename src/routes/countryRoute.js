const express = require('express');
const {  
    getAllCountries,
    createCountry,
    deleteCountry,
    updateCountry,
    getCountriesNames
} = require('../controllers/CountryController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');


const router = express.Router();

router
  .route('/')
  .post(requireAuth, restrictTo(['admin']), logActionMiddleware("Create SubAdmin", "Country"),createCountry)
  .get(requireAuth, restrictTo(['admin']), getAllCountries);
  router.route('/getCountriesNames').get(getCountriesNames)
router.route('/:id')
  .delete(requireAuth, restrictTo(['admin']), logActionMiddleware("Create SubAdmin", "Country"), deleteCountry)
  .patch(requireAuth, restrictTo(['admin']), logActionMiddleware("Update SubAdmin", "Country"), updateCountry)



module.exports = router;