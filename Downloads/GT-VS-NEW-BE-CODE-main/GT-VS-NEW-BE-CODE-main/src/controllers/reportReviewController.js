const ReportModal = require('../models/ReportReview');
const Review = require('../models/Review');
const User = require('../models/users/User');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { ReviewReportValidation } = require('../utils/joi/reportValidation');
const joiError = require('../utils/joiError');
const sendNotification = require('../utils/storeNotification');

// Create a report for a review
const createReportReview = catchAsync(async (req, res, next) => {
  const { reviewId, reportType } = req.body;

  // Validate the report data
  const { error } = ReviewReportValidation.validate(req.body, {
    abortEarly: false
  });

  if (error) {
    const errorFields = joiError(error);
    return next(new AppError('Validation failed', 400, { errorFields }));
  }

  // Check if the review exists
  const review = await Review.findById(reviewId);
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  // Check if user has already reported this review
  const existingReport = await ReportModal.findOne({
    reviewId,
    reportedBy: req.user._id,
    isDeleted: false
  });

  console.log('existingReport', existingReport);

  if (existingReport) {
    return next(new AppError('You have already reported this review', 400));
  }

  // Create the report
  const report = await ReportModal.create({
    reviewId,
    reportedBy: req.user._id,
    reportType
  });

  // Find admin to send notification
  const admin = await User.findOne({ role: 'admin' });

  if (admin) {
    // Send notification to admin
    sendNotification({
      userId: admin._id,
      title: 'New Review Report',
      message: `${req.user.firstName} ${req.user.lastName} has reported a review for ${reportType.replace(/_/g, ' ')}`,
      type: 'review',
      fortype: 'venue_feedback',
      permission: 'review',
      linkUrl: `/admin-dashboard/Review-List?tab=2&reportId=${report._id}`
    });
  }

  res.locals.dataId = report._id;

  res.status(201).json({
    status: 'success',
    message: 'Review reported successfully',
    data: {
      report
    }
  });
});

// Get all reported reviews
const getAllReportedReviews = catchAsync(async (req, res, next) => {
    const { page = 1, limit = 10, reportType, status, isDeleted = false, search } = req.query;

    const skip = (page - 1) * limit;
    const matchStage = { isDeleted: isDeleted === 'true' };

    if (reportType) {
        matchStage.reportType = reportType;
    }

    if (status) {
        matchStage.status = status;
    }

    const reports = await ReportModal.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: 'reviews',
                localField: 'reviewId',
                foreignField: '_id',
                as: 'review',
                pipeline: [{ $match: { isDeleted: false } }]
            }
        },
        {
            $unwind: { path: '$review', preserveNullAndEmptyArrays: false }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'review.reviewer',
                foreignField: '_id',
                as: 'reviewer'
            }
        },
        {
            $unwind: { path: '$reviewer', preserveNullAndEmptyArrays: true }
        },
        {
            $lookup: {
                from: 'bookings',
                localField: 'review.reviewOn',
                foreignField: '_id',
                as: 'venue',
                pipeline: [
                    {
                        $lookup: {
                            from: 'servicelistings',
                            localField: 'service',
                            foreignField: '_id',
                            as: 'service',
                            pipeline: [{ $project: { title: 1, _id: 1, media: 1 } }]
                        }
                    },
                    { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
                    { $project: { service: 1 } }
                ]
            }
        },
        {
            $unwind: { path: '$venue', preserveNullAndEmptyArrays: true }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'reportedBy',
                foreignField: '_id',
                as: 'reportedByUser'
            }
        },
        {
            $unwind: { path: '$reportedByUser', preserveNullAndEmptyArrays: true }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'reviewedBy',
                foreignField: '_id',
                as: 'reviewedByUser'
            }
        },
        {
            $unwind: { path: '$reviewedByUser', preserveNullAndEmptyArrays: true }
        },
        {
            $project: {
                _id: 1,
                reviewId: '$review._id',
                review: {
                    _id: '$review._id',
                    rating: '$review.rating',
                    comment: '$review.comment',
                    reviewType:'$review.reviewType',
                    hide: '$review.hide',
                    reviewer: {
                        _id: '$reviewer._id',
                        firstName: '$reviewer.firstName',
                        lastName: '$reviewer.lastName',
                        email: '$reviewer.email',
                        profilePicture: '$reviewer.profilePicture'
                    },
                    reviewOn: {
                        _id: '$venue._id',
                        service: '$venue.service'
                    }
                },
                reportedBy: {
                    _id: '$reportedByUser._id',
                    firstName: '$reportedByUser.firstName',
                    lastName: '$reportedByUser.lastName',
                    email: '$reportedByUser.email',
                    profilePicture: '$reportedByUser.profilePicture'
                },
                reviewedBy: {
                    _id: '$reviewedByUser._id',
                    firstName: '$reviewedByUser.firstName',
                    lastName: '$reviewedByUser.lastName',
                    email: '$reviewedByUser.email',
                        profilePicture: '$reviewedByUser.profilePicture'
                },
                reportType: 1,
                status: 1,
                adminNote: 1,
                createdAt: 1,
                reviewedAt: 1
            }
        },
        ...(search ? [{
            $match: {
                $or: [
                    { 'review.comment': { $regex: search, $options: 'i' } },
                    { 'review.reviewer.firstName': { $regex: search, $options: 'i' } },
                    { 'review.reviewer.lastName': { $regex: search, $options: 'i' } },
                    { 'review.reviewer.email': { $regex: search, $options: 'i' } },
                    { 'reportedBy.firstName': { $regex: search, $options: 'i' } },
                    { 'reportedBy.lastName': { $regex: search, $options: 'i' } },
                    { 'reportedBy.email': { $regex: search, $options: 'i' } },
                    { 'reviewedBy.firstName': { $regex: search, $options: 'i' } },
                    { 'reviewedBy.lastName': { $regex: search, $options: 'i' } },
                    { 'reviewedBy.email': { $regex: search, $options: 'i' } },
                    { 'review.reviewOn.service.title': { $regex: search, $options: 'i' } },
                    { reportType: { $regex: search, $options: 'i' } },
                    { status: { $regex: search, $options: 'i' } },
                    { adminNote: { $regex: search, $options: 'i' } }
                ]
            }
        }] : []),
        {
            $sort: { createdAt: -1 }
        },
        {
            $facet: {
                reports: [{ $skip: skip }, { $limit: parseInt(limit) }],
                totalCount: [{ $count: 'count' }]
            }
        }
    ]);

    const total = reports[0].totalCount[0]?.count || 0;
    const reportsList = reports[0].reports;

    res.status(200).json({
        status: 'success',
        results: reportsList.length,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / limit),
        data: {
            reports: reportsList
        }
    });
});

// Get single reported review
const getReportedReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const report = await ReportModal.findById(id)
    .populate({
      path: 'reviewId',
      populate: {
        path: 'reviewer reviewOn',
        select: 'firstName lastName email service'
      }
    })
    .populate('reportedBy', 'firstName lastName email');

  if (!report) {
    return next(new AppError('Report not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      report
    }
  });
});

// Update report status (Admin only)
const updateReportStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, adminNote } = req.body;

  // Validate status
  const validStatuses = ['pending', 'under_review', 'resolved', 'rejected'];
  if (status && !validStatuses.includes(status)) {
    return next(
      new AppError('Invalid status. Must be one of: pending, under_review, resolved, rejected', 400)
    );
  }

  const report = await ReportModal.findById(id);

  if (!report) {
    return next(new AppError('Report not found', 404));
  }

  // Update fields
  if (status) {
    report.status = status;
    report.reviewedBy = req.user._id;
    report.reviewedAt = Date.now();
  }

  if (adminNote !== undefined) {
    report.adminNote = adminNote;
  }

  await report.save();

  // Populate the updated report
  const updatedReport = await ReportModal.findById(id)
    .populate({
      path: 'reviewId',
      populate: {
        path: 'reviewer reviewOn',
        select: 'firstName lastName email service'
      }
    })
    .populate('reportedBy', 'firstName lastName email')
    .populate('reviewedBy', 'firstName lastName email');

  // Notify the reporter about the status update
  if (status === 'resolved' || status === 'rejected') {
    sendNotification({
      userId: report.reportedBy,
      title: `Report ${status === 'resolved' ? 'Resolved' : 'Rejected'}`,
      message: `Your report has been ${status}. ${adminNote ? `Admin note: ${adminNote}` : ''}`,
      type: 'review',
      fortype: 'venue_feedback',
      permission: 'review'
    });
  }

  res.locals.dataId = report._id;

  res.status(200).json({
    status: 'success',
    message: 'Report status updated successfully',
    data: {
      report: updatedReport
    }
  });
});

// Get reports by status
const getReportsByStatus = catchAsync(async (req, res, next) => {
  const { status } = req.params;
  const { page = 1, limit = 10, reportType } = req.query;

  const validStatuses = ['pending', 'under_review', 'resolved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return next(new AppError('Invalid status', 400));
  }

  const skip = (page - 1) * limit;
  const matchStage = { status, isDeleted: false };

  if (reportType) {
    matchStage.reportType = reportType;
  }

  const reports = await ReportModal.find(matchStage)
    .populate({
      path: 'reviewId',
      populate: {
        path: 'reviewer reviewOn',
        select: 'firstName lastName email service'
      }
    })
    .populate('reportedBy', 'firstName lastName email')
    .populate('reviewedBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await ReportModal.countDocuments(matchStage);

  res.status(200).json({
    status: 'success',
    results: reports.length,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / limit),
    data: {
      reports
    }
  });
});

// Get report statistics
const getReportStatistics = catchAsync(async (req, res, next) => {
  const stats = await ReportModal.aggregate([
    {
      $match: { isDeleted: false }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const reportTypeStats = await ReportModal.aggregate([
    {
      $match: { isDeleted: false }
    },
    {
      $group: {
        _id: '$reportType',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  const totalReports = await ReportModal.countDocuments({ isDeleted: false });
  const pendingReports = await ReportModal.countDocuments({ status: 'pending', isDeleted: false });
  const underReviewReports = await ReportModal.countDocuments({
    status: 'under_review',
    isDeleted: false
  });
  const resolvedReports = await ReportModal.countDocuments({
    status: 'resolved',
    isDeleted: false
  });
  const rejectedReports = await ReportModal.countDocuments({
    status: 'rejected',
    isDeleted: false
  });

  res.status(200).json({
    status: 'success',
    data: {
      overview: {
        total: totalReports,
        pending: pendingReports,
        underReview: underReviewReports,
        resolved: resolvedReports,
        rejected: rejectedReports
      },
      statusBreakdown: stats,
      reportTypeBreakdown: reportTypeStats
    }
  });
});

// Delete a report (soft delete)
const deleteReportedReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const report = await ReportModal.findById(id);

  if (!report) {
    return next(new AppError('Report not found', 404));
  }

  report.isDeleted = true;
  await report.save();

  res.status(204).json({
    status: 'success',
    data: null
  });
});

module.exports = {
  createReportReview,
  getAllReportedReviews,
  getReportedReview,
  updateReportStatus,
  getReportsByStatus,
  getReportStatistics,
  deleteReportedReview
};
