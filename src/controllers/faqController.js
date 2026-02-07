
const Faq = require('../models/FAQ');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { FAQValidation } = require('../utils/joi/FAQVaildation');
const joiError = require('../utils/joiError');

// Get all FAQs (optionally filter by serviceId)
const getAllFaqs = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { isDeleted = false } = req.query;
    const filter = { serviceId: id, isDeleted }
    const faqs = await Faq.find(filter);
    res.status(200).json({
        status: 'success',
        results: faqs.length,
        data: faqs
    });
});
const getAllFaqswithoutId = catchAsync(async (req, res, next) => {
    try {
        const { faqType, isDeleted = false, search } = req.query;
        let filter = faqType ? { faqType, isDeleted } : { isDeleted };

        if (search) {
            filter = {
                ...filter,
                $or: [
                    { question: { $regex: new RegExp(search, 'i') } },
                    { answer: { $regex: new RegExp(search, 'i') } },
                    { videoTitle: { $regex: new RegExp(search, 'i') } },
                    { videoDescription: { $regex: new RegExp(search, 'i') } },
                ]
            };
        }

        const faqs = await Faq.find(filter);

        res.status(200).json({
            status: 'success',
            results: faqs.length,
            data: faqs
        });
    } catch (error) {
        return next(new AppError('Failed to retrieve FAQs', 500));
    }
});

// Create a new FAQ
const createFaq = catchAsync(async (req, res, next) => {
    const { dataType ,faqType} = req.body;

    if (!dataType) {
        return next(new AppError('dataType is required', 400));
    }

    let requiredFields = [];

    if (faqType === "service") {
        requiredFields.push("serviceId")
    }
    if (dataType === 'text') {
        requiredFields = ['faqType', 'dataType', 'question', 'answer'];
    } else if (dataType === 'training') {
        requiredFields = ['faqType', 'dataType', 'videoTitle',  'videoDescription'];
    }  else {
        return next(new AppError('Invalid dataType provided', 400));
    }

    const partialSchema = FAQValidation.fork(requiredFields, (schema) => schema.required());

    const { error } = partialSchema.validate(req.body, {
        allowUnknown: true,
        abortEarly: false
    });

    if (error) {
        const errorFields = joiError(error);
        return next(new AppError("Invalid request", 400, { errorFields }));
    }

    const newFaq = await Faq.create(req.body);

    return res.status(201).json({
        status: 'success',
        data: newFaq
    });
});

// Update an existing FAQ
const updateFaq = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return next(new AppError('Please provide FAQ id', 400));
    }

    const toValidate = Object.keys(req.body);
    console.log(toValidate, "validate data");



    const { error } = FAQValidation.validate(req.body, {
        abortEarly: false,
        allowUnknown: true
    });

    if (error) {
        const errorFields = joiError(error);
        return next(new AppError("Invalid request", 400, { errorFields }));
    }

    const updatedFaq = await Faq.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
    });

    if (!updatedFaq) {
        return next(new AppError('No FAQ found with that ID', 404));
    }

    return res.status(200).json({
        status: 'success',
        data: updatedFaq,
        message: "FAQ updated successfully"
    });
});

// Delete an FAQ by ID
const deleteFaq = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return next(new AppError('Please provide FAQ id', 400));
    }

    const deletedFaq = await Faq.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

    if (!deletedFaq) {
        return next(new AppError('No FAQ found with that ID', 404));
    }

    return res.status(204).json({
        status: 'success',
        data: null,
        message: "FAQ deleted successfully"
    });
});

module.exports = {
    getAllFaqs,
    createFaq,
    deleteFaq,
    updateFaq,
    getAllFaqswithoutId
};
