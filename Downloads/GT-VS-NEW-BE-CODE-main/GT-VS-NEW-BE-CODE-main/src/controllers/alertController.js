const { default: mongoose } = require('mongoose');
const Notification = require('../models/Notification');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/users/User');
const sendNotification = require('../utils/storeNotification');
const ServiceListing = require('../models/ServiceListing');

// Get all alert notifications with pagination (latest first)

const getAlertNotifications = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : '';

  // Build the query - you can add filters if needed
  const matchQuery = { type: 'alert' };

  // Optional: Filter by user if needed
  // if (req.user && req.user._id) {
  //   matchQuery.userId = new mongoose.Types.ObjectId(req.user._id);
  // }

  // Fetch alert notifications with pagination
  const pipeline = [
    { $match: matchQuery },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    {
      $unwind: {
        path: '$userInfo',
        preserveNullAndEmptyArrays: true
      }
    }
  ];

  // Add search filter if search query is provided
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: searchRegex } },
          { message: { $regex: searchRegex } },
          { linkUrl: { $regex: searchRegex } },
          { 'userInfo.firstName': { $regex: searchRegex } },
          { 'userInfo.lastName': { $regex: searchRegex } },
          { 'userInfo.email': { $regex: searchRegex } },
          {
            $expr: {
              $regexMatch: {
                input: {
                  $concat: [
                    { $ifNull: ['$userInfo.firstName', ''] },
                    ' ',
                    { $ifNull: ['$userInfo.lastName', ''] }
                  ]
                },
                regex: search,
                options: 'i'
              }
            }
          }
        ]
      }
    });
  }

  // Get total count after search filter
  const countPipeline = [...pipeline, { $count: 'total' }];
  const countResult = await Notification.aggregate(countPipeline);
  const totalAlerts = countResult[0]?.total || 0;

  // Add sorting, pagination, and projection
  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        title: 1,
        message: 1,
        type: 1,
        isRead: 1,
        isDelivered: 1,
        createdAt: 1,
        linkUrl: 1,
        user: {
          _id: '$userInfo._id',
          name: {
            $concat: ['$userInfo.firstName', ' ', '$userInfo.lastName']
          },
          email: '$userInfo.email',
          profilePicture: '$userInfo.profilePicture',
          role: '$userInfo.role'
        }
      }
    }
  );

  const alerts = await Notification.aggregate(pipeline);

  res.status(200).json({
    status: 'success',
    results: alerts.length,
    pagination: {
      total: totalAlerts,
      page,
      limit,
      pages: Math.ceil(totalAlerts / limit)
    },
    data: alerts
  });
});

// Create and send alert notification to admin for a service report
const createServiceReportAlert = catchAsync(async (req, res, next) => {
  const { serviceId, title, message, linkUrl } = req.body;
  console.log('serviceId, title, message, linkUrl', serviceId, title, message, linkUrl);

  if (!serviceId || !title || !message || !linkUrl) {
    return next(
      new AppError('serviceId, title, message and linkUrl are required', 400)
    );
  }

  // Find primary admin user
  const adminUser = await User.findOne({ role: 'admin' }).select('_id');

  if (!adminUser) {
    return next(new AppError('Admin user not found', 404));
  }



  const service = await ServiceListing.findById(serviceId);
  const serviceName = service?.title || 'a service';

  await sendNotification({
    userId: adminUser._id,
    title,
    message:`Message By ${req.user.firstName} ${req.user.lastName} on  ${serviceName}: ${message}`,
    type: 'alert', 
    fortype: 'venue_feedback',
    permission: 'logs',
    linkUrl: `/listing-detail/${serviceId}`
  });

  res.status(201).json({
    status: 'success',
    message: 'Alert notification sent to admin successfully'
  });
});

module.exports = {
  getAlertNotifications,
  createServiceReportAlert
};
