const Payout = require('../models/CustomerPayHistory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Apifeature = require('../utils/apiFeatures');
const { getPDFBuffer, getExcelBuffer } = require('../utils/pdfandexcel');

// Utility to format payout data
const formatPayoutData = (payouts) => {
  return payouts.map((p) => ({
    customer: `${p.customerId?.firstName || ''} ${p.customerId?.lastName || ''}`,
    email: p.customerId?.email || '',
    serviceTitle: p.bookingId?.service?.title || '',
    bank: p?.bank || '',
    amount: p?.totalAmount + '$' || 0,
    status: p?.status || 'Pending',
    date: p.createdAt?.toISOString().split('T')[0] || ''
  }));
};

const getAllPayoutsForAdmin = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, search = '', status = 'Paid' } = req.query;
  const skip = (page - 1) * parseInt(limit, 10);

  const matchStage = {};

  if (search) {
    const regex = { $regex: search, $options: 'i' };
    matchStage.$or = [
      { 'customerId.fullName': regex },
      { 'customerId.email': regex },
      { 'bookingId.service.title': regex },
      { status: regex }
    ];
  }
  if (status) {
    matchStage.status = status;
  }

  if (req.user.role === 'customer') {
    matchStage['customerId._id'] = req.user._id;
  }

  const basePipeline = [
    {
      $lookup: {
        from: 'users',
        localField: 'customerId',
        foreignField: '_id',
        as: 'customerId'
      }
    },
    { $unwind: '$customerId' },
    {
      $addFields: {
        'customerId.fullName': {
          $concat: [
            { $ifNull: ['$customerId.firstName', ''] },
            ' ',
            { $ifNull: ['$customerId.lastName', ''] }
          ]
        }
      }
    },
    {
      $lookup: {
        from: 'bookings',
        localField: 'bookingId',
        foreignField: '_id',
        as: 'bookingId'
      }
    },
    { $unwind: '$bookingId' },
    {
      $lookup: {
        from: 'servicelistings',
        localField: 'bookingId.service',
        foreignField: '_id',
        as: 'bookingId.service'
      }
    },
    { $unwind: { path: '$bookingId.service', preserveNullAndEmptyArrays: true } },
    { $match: matchStage },
    {
      $project: {
        'customerId.firstName': 1,
        'customerId.lastName': 1,
        'customerId.email': 1,
        'customerId.fullName': 1,
        'customerId.profilePicture': 1,
        'bookingId.service.title': 1,
        'bookingId.service.description': 1,
        'bookingId.service.media': 1,
        bank: 1,
        totalAmount: 1,
        status: 1,
        refundType: 1,
        createdAt: 1
      }
    }
  ];

  const paginatedPipeline = [...basePipeline, { $skip: skip }, { $limit: parseInt(limit, 10) }];

  const [payouts, totalCountResult] = await Promise.all([
    Payout.aggregate(paginatedPipeline),
    Payout.aggregate([...basePipeline, { $count: 'total' }])
  ]);

  const totalpayouts = totalCountResult[0]?.total || 0;

  res.status(200).json({
    status: 'success',
    results: payouts.length,
    totalpayouts,
    data: payouts
  });
});

// Get all payouts for customer
const getAllPayoutsForCustomer = catchAsync(async (req, res) => {
  const Apifeatures = new Apifeature(
    Payout.find({ customerId: req.user._id }),
    req.query
  ).paginate();

  const payouts = await Apifeatures.query.populate({
    path: 'bookingId',
    populate: {
      path: 'service',
      model: 'ServiceListing',
      select: 'title description media'
    }
  });

  const totalpayouts = await Payout.countDocuments();

  res.status(200).json({
    status: 'success',
    results: payouts.length,
    data: payouts,
    totalpayouts
  });
});

// Export PDF as base64 URL
const exportPayoutBuffer = catchAsync(async (req, res, next) => {
  const { type } = req.query;
  if (!type || (type !== 'pdf' && type !== 'excel')) {
    return next(new AppError('Invalid type', 400));
  }
  const payouts = await Payout.find()
    .populate('customerId', 'firstName lastName email')
    .populate({
      path: 'bookingId',
      populate: {
        path: 'service',
        model: 'ServiceListing',
        select: 'title'
      }
    });

  const data = formatPayoutData(payouts);
  let buffer, base64, dataUrl;

  if (type === 'pdf') {
    const columns = [
      { label: 'Customer', key: 'customer', width: 100 },
      { label: 'Email', key: 'email', width: 150 },
      { label: 'Service', key: 'serviceTitle', width: 130 },
      { label: 'Bank', key: 'bank', width: 70 },
      { label: 'Amount', key: 'amount', width: 60 },
      { label: 'Status', key: 'status', width: 100 },
      { label: 'Date', key: 'date', width: 80 }
    ];
    buffer = await getPDFBuffer(data, columns, 'Payouts');
    base64 = buffer.toString('base64');
    dataUrl = `data:application/pdf;base64,${base64}`;
  } else {
    const columns = [
      { label: 'Customer', key: 'customer', width: 20 },
      { label: 'Email', key: 'email', width: 30 },
      { label: 'Service', key: 'serviceTitle', width: 30 },
      { label: 'Bank', key: 'bank', width: 20 },
      { label: 'Amount', key: 'amount', width: 20 },
      { label: 'Status', key: 'status', width: 20 },
      { label: 'Date', key: 'date', width: 20 }
    ];

    buffer = await getExcelBuffer(data, columns, 'Payouts');
    base64 = buffer.toString('base64');
    dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
  }

  res.status(200).json({
    status: 'success',
    dataUrl
  });
});

module.exports = {
  getAllPayoutsForAdmin,
  getAllPayoutsForCustomer,
  exportPayoutBuffer
};
