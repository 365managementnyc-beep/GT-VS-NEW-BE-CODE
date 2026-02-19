const Advertisement = require('../models/Advertisement');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { advertisementSchema } = require('../utils/joi/advertisementValidation');
const joiError = require('../utils/joiError');
const { normalizeIsDeleted, withSoftDeleteFilter } = require('../utils/softDeleteFilter');

// Get All Advertisement
const getAllAdvertisement = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const isDeleted = normalizeIsDeleted(req.query.isDeleted);
  const skip = (page - 1) * limit;
  const filterQuery = withSoftDeleteFilter({}, isDeleted);

  const advertisementQuery = Advertisement.find(filterQuery).skip(skip).limit(parseInt(limit, 10));
  const [advertisement, totalCount] = await Promise.all([
    advertisementQuery,
    Advertisement.countDocuments(filterQuery)
  ]);

  return res.status(200).json({
    status: 'success',
    results: advertisement.length,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: parseInt(page, 10),
    data: advertisement
  });
});

// Create Advertisement
const createAdvertisement = catchAsync(async (req, res, next) => {

  const { image ,imagekey, link} = req.body;
      const partialSchema = advertisementSchema.fork(["image", "imagekey", "link"], (schema) => schema.required());
    const { error } = partialSchema.validate(req.body, {
        allowUnknown: true,
        abortEarly: false
    });

    if (error) {
        const errorFields = joiError(error);
        return next(new AppError("Invalid request", 400, { errorFields }));
    }


  // Create the Advertisement
  const newAdvertisement = await Advertisement.create({
    image,
    imagekey,
    link
  });
res.locals.dataId = newAdvertisement._id; // Store the ID of the created Advertisement in res.locals
  return res.status(201).json({
    status: 'success',
    data: newAdvertisement,
    message: 'Advertisement created successfully'
  });
});

/// ///////update advertisement
const updateAdvertisement = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError('Please provide Advertisement id', 400));
  }
  const { error } = advertisementSchema.validate(req.body, {
      allowUnknown: true,
      abortEarly: false
  });

  if (error) {
      const errorFields = joiError(error)
      return next(new AppError("Invalid request", 400, { errorFields }));
  }


  const updatedAdvertisement = await Advertisement.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });

  if (!updatedAdvertisement) {
    return next(new AppError('No advertisement found with that ID', 404));
  }

  return res.status(200).json({
    status: 'success',
    data: updatedAdvertisement
  });
});
// Delete Advertisement
const deleteAdvertisement = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError('Please provide Advertisement id', 400));
  }

  const deletedAdvertisement = await Advertisement.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  if (!deletedAdvertisement) {
    return next(new AppError('No advertisement found with that ID', 404));
  }
  res.locals.dataId = deletedAdvertisement._id; // Store the ID of the created Advertisement in res.locals
  return res.status(204).json({
    status: 'success',
    data: null
  });
});

module.exports = {
  getAllAdvertisement,
  createAdvertisement,
  deleteAdvertisement,
  updateAdvertisement
};

