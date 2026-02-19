const Gadgets = require('../models/ServiceGadgets');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const getAllGadgets = catchAsync(async (req, res) => {
  const isDeleted = req.query.isDeleted === 'true' || req.query.isDeleted === 'false' ? req.query.isDeleted : false;
  const gadgets = await Gadgets.find({ isDeleted});
  res.status(200).json({
    status: 'success',
    results: gadgets.length,
    data: gadgets
  });
});

const createGadget = catchAsync(async (req, res, next) => {
  const Gadget = req.body.name;
  if (!Gadget || typeof Gadget !== 'string') {
    return next(
      new AppError('Please provide Gadget name', 400, {
        name: 'name not found'
      })
    );
  }

  const newGadgat = await Gadgets.create({ name: Gadget });
  res.locals.dataId = newGadgat._id; // Store the ID of the created Gadget in res.locals
  return res.status(201).json({
    status: 'success',
    data: newGadgat
  });
});

const deleteGadget = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new AppError('Please provide Gadget id', 400));
  }

  const deletedGadgets = await Gadgets.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  if (!deletedGadgets) {
    return next(new AppError('No Gadget found with that ID', 404));
  }

  res.locals.dataId = deletedGadgets._id;
  return res.status(204).json({
    status: 'success',
    data: null,
    message: 'Gedgat deleted successfully'
  });
});

module.exports = {
  getAllGadgets,
  createGadget,
  deleteGadget
};
