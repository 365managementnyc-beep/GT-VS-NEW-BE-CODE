const { deleteMedia } = require('../middlewares/aws-v3');
const ServiceCategory = require('../models/ServiceCategory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const serviceCategorySchema = require('../utils/joi/serviceCategoryValidation');
const joiError = require('../utils/joiError');

const getAllCategories = catchAsync(async (req, res) => {
  const categories = await ServiceCategory.find({
    $or: [{ isDeleted: { $exists: false } }, { isDeleted: false }]
  });
  res.status(200).json({
    status: 'success',
    results: categories.length,
    data: categories
  });
});

const createCateGory = catchAsync(async (req, res, next) => {
  const partialSchema=serviceCategorySchema.fork(['name', 'blackIcon', 'whiteIcon', 'whiteKey', 'blackKey'], (field) => field.required()); 
  const {error}=partialSchema.validate(req.body,{abortEarly: false,allowUnknown: true});
  if (error) {
    const errorFields = joiError(error);
    return next(new AppError('Validation failed', 400, { errorFields }));
  }
  const newCatagory = await ServiceCategory.create(req.body);
  res.locals.dataId = newCatagory._id;
  return res.status(201).json({
    status: 'success',
    data: newCatagory
  });
});

const deleteCatagory = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError('Please provide Catagory id', 400));
  }

  const deletedCatagory = await ServiceCategory.findOneAndUpdate({ _id: id, $or: [{ isDeleted: { $exists: false } }, { isDeleted: false }]}, { isDeleted: true }, { new: true });
  if (!deletedCatagory) {
    return next(new AppError('No Catagory found with that ID', 404));
  }
  res.locals.dataId = deletedCatagory._id;

  return res.status(200).json({
    status: 'success',
    data: null
  });
});

const updateCategory=catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError('Please provide Catagory id', 400));
  }
  const { error } = serviceCategorySchema.validate(req.body, { abortEarly: false, allowUnknown: true });
  if (error) {
    const errorFields = joiError(error);
    return next(new AppError('Validation failed', 400, { errorFields }));
  }


  const updatedCatagory = await ServiceCategory.findOne({ _id: id, $or: [{ isDeleted: { $exists: false } }, { isDeleted: false }]});
  if (!updatedCatagory) {
    return next(new AppError('No Catagory found with that ID', 404));
  }
  if(updatedCatagory.whiteIcon!==req.body.whiteIcon){
    await deleteMedia(updatedCatagory.whiteKey);
    updatedCatagory.whiteIcon=req.body.whiteIcon;
    updatedCatagory.whiteKey=req.body.whiteKey;
  }
  if(updatedCatagory.blackIcon!==req.body.blackIcon){
    await deleteMedia(updatedCatagory.blackKey);
    updatedCatagory.blackIcon=req.body.blackIcon;
    updatedCatagory.blackKey=req.body.blackKey;
  }
  if(req.body.name){
    updatedCatagory.name=req.body.name;
  }
  if(req.body.typevalue){
    updatedCatagory.typevalue=req.body.typevalue;
  }


  await updatedCatagory.save();

  res.locals.dataId = updatedCatagory._id;
  return res.status(200).json({
    status: 'success',
    data: null
  });
})

module.exports = {
  getAllCategories,
  createCateGory,
  deleteCatagory,
  updateCategory
};
