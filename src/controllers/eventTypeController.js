const EventType = require('../models/EventType');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { eventTypeSchema } = require('../utils/joi/eventTypeValidation');
const joiError = require('../utils/joiError');

const createEventType = catchAsync(async (req, res, next) => {
  // Validate request body

  const { error } = eventTypeSchema.validate(req.body);
  if (error) return next(new AppError(joiError(error), 400));

  const newEventType = await EventType.create(req.body);
  res.locals.dataId = newEventType._id; // For logging
  res.status(201).json({
    status: 'success',
    data: {
      eventType: newEventType
    }
  });
});

// Get All Event Types
const getAllEventTypes = catchAsync(async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build match stage for search
    const matchStage = {};
    if (search) {
        matchStage.$or = [
            { name: { $regex: search, $options: 'i' } },
        ];
    }


    const pipeline = [
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        {
            $facet: {
                data: [
                    { $skip: parseInt(skip) },
                    { $limit: parseInt(limit) }
                ],
                totalCount: [
                    { $count: "count" }
                ]
            }
        }
    ];

    const result = await EventType.aggregate(pipeline);
    const eventTypes = result[0].data;
    const totalResults = result[0].totalCount[0]?.count || 0;

    res.status(200).json({
        status: 'success',
        results: eventTypes.length,
        totalResults,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalResults / limit),
        data: {
            eventTypes
        }
    });
});
const deleteEventType = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const eventType = await EventType.findByIdAndDelete(id);
    if (!eventType) return next(new AppError('No event type found with that ID', 404));

    res.status(204).json({
        status: 'success',
        data: null
    });
});
const updateEventType = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { error } = eventTypeSchema.validate(req.body);
    if (error) return next(new AppError(joiError(error), 400));

    const eventType = await EventType.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
    });
    if (!eventType) return next(new AppError('No event type found with that ID', 404));

    res.status(200).json({
        status: 'success',
        data: {
            eventType
        }
    });
});
const getNamesforDropdown = catchAsync(async (req, res, next) => {
    const eventTypes = await EventType.find().select('name');
    res.status(200).json({
        status: 'success',
        data: {
            eventTypes
        }
    });
});

module.exports = {
    createEventType,
    getAllEventTypes,
    deleteEventType,
    updateEventType,
    getNamesforDropdown
};

   
