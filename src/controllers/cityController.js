const City = require('../models/City');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { CityValidation } = require('../utils/joi/countryValidation');
const joiError = require('../utils/joiError');
const { sendMailtoSuscribers } = require('../utils/sendNewsLetter');
const { normalizeIsDeleted, withSoftDeleteFilter } = require('../utils/softDeleteFilter');

// Get All Cities
const getAllCities = catchAsync(async (req, res) => {
    const { search } = req.query;
    const isDeleted = normalizeIsDeleted(req.query.isDeleted);
    let query = {};
    if (search) {
        query.$or = [
            { city: { $regex: search, $options: 'i' } },
            { province: { $regex: search, $options: 'i' } },
            { country: { $regex: search, $options: 'i' } }
        ];
    }
    query = withSoftDeleteFilter(query, isDeleted);
    const features = new APIFeatures(City.find(query), req.query).paginate();
    const cities = await features.query;
    const totalCities = await City.countDocuments(query);

    return res.status(200).json({
        status: 'success',
        results: cities.length,
        totalCities,
        data: cities
    });
});

// Create City
const createCity = catchAsync(async (req, res, next) => {
    const { country, city, province,provincelatlng,citylatlng,countrylatlng } = req.body;
    const partialSchema = CityValidation.fork(["country", "city", "province","provincelatlng","citylatlng","countrylatlng"], (schema) => schema.required());
    const { error } = partialSchema.validate(req.body, {
        abortEarly: false,
        allowUnknown: true
    });

    if (error) {
        const errorFields = joiError(error);
        return next(new AppError('Validation failed', 400, { errorFields }));
    }
    // Check if country already exists
    const existingCity = await City.findOne({ country, city });
    if (existingCity) {
        return next(new AppError('City already exists', 400));
    }

    // Create the City
    const newCity = await City.create({ country, city, province,provincelatlng,citylatlng,countrylatlng});
    sendMailtoSuscribers("city", message = `
        Exciting News! A brand new city, ${newCity.city}, has been added to our platform.
        Explore opportunities to list and provide your services in this vibrant location.
    `);

    res.locals.dataId = newCity._id; // Store the ID of the created City in res.locals
    return res.status(201).json({
        status: 'success',
        data: newCity
    });
});

// Delete City
const deleteCity = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return next(new AppError('Please provide City id', 400));
    }

    const deletedCity = await City.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!deletedCity) {
        return next(new AppError('No city found with that ID', 404));
    }
    
    res.locals.dataId = deletedCity._id;
    return res.status(204).json({
        status: 'success',
        data: null
    });
});

// Update City
const updateCity = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { country, city, province ,provincelatlng,citylatlng,countrylatlng, status } = req.body;

    const { error } = CityValidation.validate(req.body, {
        abortEarly: false,
        allowUnknown: true
    });


    if (error) {
        const errorFields = joiError(error);
        return next(new AppError('Validation failed', 400, { errorFields }));
    }

    if (!id) {
        return next(new AppError('Please provide City id', 400));
    }

    const updatedCity = await City.findByIdAndUpdate(
        id,
        { country, city, province,provincelatlng,citylatlng,countrylatlng ,status },
        { new: true, runValidators: true }
    );

    if (!updatedCity) {
        return next(new AppError('No city found with that ID', 404));
    }

    res.locals.dataId = updatedCity._id; // Store the ID of the created City in res.locals
    return res.status(200).json({
        status: 'success',
        data: updatedCity
    });
});
/// //////////////////////////////////////get cities names///////////////////////////////////////
const getCitiesNames = catchAsync(async (req, res) => {
    const isDeleted = normalizeIsDeleted(req.query.isDeleted);
    const cities = await City.find(withSoftDeleteFilter({ status:"Active" }, isDeleted)).select('city country');
    return res.status(200).json({
        status: 'success',
        results: cities.length,
        data: cities
    });
});

module.exports = {
    getAllCities,
    createCity,
    deleteCity,
    updateCity,
    getCitiesNames
};

