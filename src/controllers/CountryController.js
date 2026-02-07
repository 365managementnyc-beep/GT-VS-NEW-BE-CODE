const Country = require('../models/Country');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { CountryValidation } = require('../utils/joi/countryValidation');
const joiError = require('../utils/joiError');
const { sendMailtoSuscribers } = require('../utils/sendNewsLetter');

// Get All Countries
const getAllCountries = catchAsync(async (req, res) => {
    const { isDeleted = false, search } = req.query;
    const queryObj = { isDeleted };
    if (search) {
        queryObj.$or = [
            { country: { $regex: search, $options: 'i' } },
            { region: { $regex: search, $options: 'i' } },
            { currency: { $regex: search, $options: 'i' } }
        ];
    }
    const features = new APIFeatures(Country.find(queryObj), req.query).paginate();
    const countries = await features.query;
    const totalCountries = await Country.countDocuments(queryObj);

    return res.status(200).json({
        status: 'success',
        results: countries.length,
        totalCountries,
        data: countries
    });
});

// Create Country
const createCountry = catchAsync(async (req, res, next) => {
    const { country, region, currency, latlng } = req.body;
    const partialSchema = CountryValidation.fork(["country", "region", "currency", "latlng"], (schema) => schema.required());
    const { error } = partialSchema.validate(req.body, {
        abortEarly: false,
        allowUnknown: true
    });

    if (error) {
        const errorFields = joiError(error);
        return next(new AppError('Validation failed', 400, { errorFields }));
    }

    // Check if country already exists
    const existingCountry = await Country.findOne({ country, isDeleted: false });
    if (existingCountry) {
        return next(new AppError('Country already exists', 400));
    }

    // Create the Country
    const newCountry = await Country.create({ country, region, currency, latlng });
    sendMailtoSuscribers("country", `
        Exciting News! A brand new country, ${country}, has been added to our platform.
        Explore opportunities to list and provide your services in this vibrant location.
        Region: ${region}, Currency: ${currency}.
        Vendors can now provide services in this country, and customers can book services here.
    `);

    res.locals.dataId = newCountry._id; // Store the ID of the created country in res.locals
    return res.status(201).json({
        status: 'success',
        data: newCountry
    });
});

// Soft Delete Country
const deleteCountry = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return next(new AppError('Please provide Country id', 400));
    }

    const deletedCountry = await Country.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    if (!deletedCountry) {
        return next(new AppError('No country found with that ID', 404));
    }
    res.locals.dataId = deletedCountry._id; // Store the ID of the deleted country in res.locals
    return res.status(204).json({
        status: 'success',
        data: null
    });
});

// Update Country
const updateCountry = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { country, region, currency, latlng, status } = req.body;

    const { error } = CountryValidation.validate(req.body, {
        abortEarly: false,
        allowUnknown: true
    });

    if (error) {
        const errorFields = joiError(error);
        return next(new AppError('Validation failed', 400, { errorFields }));
    }

    if (!id) {
        return next(new AppError('Please provide Country id', 400));
    }

    const updatedCountry = await Country.findByIdAndUpdate(
        id,
        { country, region, currency, latlng, status },
        { new: true, runValidators: true }
    );

    if (!updatedCountry) {
        return next(new AppError('No country found with that ID', 404));
    }
    res.locals.dataId = updatedCountry._id; // Store the ID of the updated country in res.locals

    return res.status(200).json({
        status: 'success',
        data: updatedCountry
    });
});

/// ///////////////////////get countries names///////////////////////////////////////
const getCountriesNames = catchAsync(async (req, res) => {
    const { isDeleted = false } = req.query;
    const countries = await Country.find({ status: "Active", isDeleted: isDeleted }).select('country');
    return res.status(200).json({
        status: 'success',
        results: countries.length,
        data: countries
    });
});

module.exports = {
    getAllCountries,
    createCountry,
    deleteCountry,
    updateCountry,
    getCountriesNames
};

