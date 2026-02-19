const Payout = require('../models/CustomerPayHistory');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const ServiceListing = require('../models/ServiceListing');
const mongoose = require('mongoose');
const moment = require('moment');
const User = require('../models/users/User');
const Payment = require('../models/Payment');
const Bookings = require('../models/Bookings');
const { servicelistingFormat } = require('../utils/dataformat');
const Staff = require('../models/users/Staff');
const { withSoftDeleteFilter } = require('../utils/softDeleteFilter');
const getReportForVendor = catchAsync(async (req, res) => {
    const vendorId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = withSoftDeleteFilter({}, false);

    if (req.query.serviceTypeId) {
        query.serviceTypeId = new mongoose.Types.ObjectId(req.query.serviceTypeId);
    }
    const [serviceListings, totalCount] = await Promise.all([
        ServiceListing.aggregate([
            { $match: { ...query, vendorId } },
            {
                $lookup: {
                    from: 'bookings',
                    let: { serviceId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$service', '$$serviceId'] } } },
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalCompletedBookings: {
                                    $sum: { $cond: { if: { $eq: ['$_id', 'completed'] }, then: '$count', else: 0 } }
                                },
                                totalBookedBookings: {
                                    $sum: { $cond: { if: { $eq: ['$_id', 'booked'] }, then: '$count', else: 0 } }
                                },
                                totalPendingBookings: {
                                    $sum: { $cond: { if: { $eq: ['$_id', 'pending'] }, then: '$count', else: 0 } }
                                },
                                totalCancelledBookings: {
                                    $sum: { $cond: { if: { $eq: ['$_id', 'canceled'] }, then: '$count', else: 0 } }
                                },
                                totalRejectedBookings: {
                                    $sum: { $cond: { if: { $eq: ['$_id', 'rejected'] }, then: '$count', else: 0 } }
                                }
                            }
                        }
                    ],
                    as: 'completedBookings'
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    media: 1,
                    completedBookings: { $arrayElemAt: ['$completedBookings.totalCompletedBookings', 0] },
                    bookedBookings: { $arrayElemAt: ['$completedBookings.totalBookedBookings', 0] },
                    pendingBookings: { $arrayElemAt: ['$completedBookings.totalPendingBookings', 0] },
                    cancelledBookings: { $arrayElemAt: ['$completedBookings.totalCancelledBookings', 0] },
                    rejectedBookings: { $arrayElemAt: ['$completedBookings.totalRejectedBookings', 0] },
                    createdAt: 1,
                    updatedAt: 1
                }
            },
            { $skip: skip },
            { $limit: limit }
        ]),
        ServiceListing.countDocuments(withSoftDeleteFilter({ vendorId }, false)),
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            serviceListings,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page
        }
    });
});

const customerDashboard = catchAsync(async (req, res) => {
    console.log('req.user', req.user?.lastViewedServices);
    const lastviewlistings = await ServiceListing.aggregate([
        {
            $match: {
                _id: {
                    $in: req.user?.lastViewedServices || []
                },
                status: "Available"
                ,...withSoftDeleteFilter({}, false)
            }
        },
        ...servicelistingFormat
    ]);

    const ListingwithmoreBookings = await ServiceListing.aggregate([
        ...servicelistingFormat,

        {
            $sort: { totalBookings: -1 }
        },
        {
            $match: {
                status: "Available",
                completed: true,
                VerificationStatus: "verified",
                ...withSoftDeleteFilter({}, false)
            }
        },
        {
            $limit: 4
        }
    ]);

    ///////////////favourite listings counts/////////////////////
    const favouriteListingsCount = await ServiceListing.countDocuments({
        likedBy: { $in: [req.user._id?.toString()] || [] },
        ...withSoftDeleteFilter({}, false)
    });

    const countStaff = await Staff.countDocuments({
        staffOf: req.user._id
    });

    res.status(200).json({
        status: 'success',
        data: {
            lastviewlistings,
            ListingwithmoreBookings,
            favouriteListingsCount,
            totalStaff: countStaff || 0,
        }
    });
});

const vendorDashboard = catchAsync(async (req, res) => {
    const vendorId = req.user._id;

    // 1. Aggregation for service stats (bookings, users, listings)
    const serviceListingsCount = await ServiceListing.aggregate([
        {
            $match: {
                vendorId,
                ...withSoftDeleteFilter({}, false)
            }
        },
        {
            $lookup: {
                from: 'bookings',
                localField: '_id',
                foreignField: 'service',
                as: 'bookings'
            }
        },
        { $unwind: { path: '$bookings' } },
        {
            $group: {
                _id: null,
                totalBookings: { $addToSet: '$bookings._id' },
                confirmedBookings: {
                    $sum: {
                        $cond: [{ $eq: ['$bookings.status', 'booked'] }, 1, 0]
                    }
                },
                pendingBookings: {
                    $sum: {
                        $cond: [{ $eq: ['$bookings.status', 'pending'] }, 1, 0]
                    }
                },
                CancelledBookings: {
                    $sum: {
                        $cond: [{ $eq: ['$bookings.status', 'cancelled'] }, 1, 0]
                    }
                },
                RejectedBookings: {
                    $sum: {
                        $cond: [{ $eq: ['$bookings.status', 'rejected'] }, 1, 0]
                    }
                },
                completedBookings: {
                    $sum: {
                        $cond: [{ $eq: ['$bookings.status', 'completed'] }, 1, 0]
                    }
                },
                totalServiceListings: { $addToSet: '$_id' },
                totalUsers: { $addToSet: '$bookings.user' }
            }
        },
        {
            $project: {
                totalBookings: { $size: '$totalBookings' },
                confirmedBookings: 1,
                pendingBookings: 1,
                CancelledBookings: 1,
                RejectedBookings: 1,
                completedBookings: 1,
                totalServiceListings: { $size: '$totalServiceListings' },
                totalUniqueUsers: { $size: '$totalUsers' }
            }
        }
    ]);

    // 2. Separate aggregation to calculate total earnings
    const totalEarningsAgg = await Payment.aggregate([
        {
            $match: {
                vendorId: vendorId,
                status: 'completed'
            }
        },
        {
            $group: {
                _id: null,
                totalEarnings: { $sum: '$amount' }
            }
        }
    ]);

    const totalEarnings = totalEarningsAgg[0]?.totalEarnings || 0;

    // 3. Date range for chart
    let { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        const thisMonth = moment.utc(); // Current month
        startDate = thisMonth.startOf('month').toDate();
        endDate = thisMonth.endOf('month').toDate();
    } else {
        startDate = moment.utc(startDate).startOf('day').toDate();
        endDate = moment.utc(endDate).endOf('day').toDate();
    }

    // 4. Chart data: Daily bookings
    const bookingsCountonStartDateandEndDate = await ServiceListing.aggregate([
        {
            $match: {
                vendorId,
                ...withSoftDeleteFilter({}, false)
            }
        },
        {
            $lookup: {
                from: 'bookings',
                localField: '_id',
                foreignField: 'service',
                as: 'bookings'
            }
        },
        {
            $unwind: { path: '$bookings', preserveNullAndEmptyArrays: true }
        },
        {
            $match: {
                'bookings.createdAt': {
                    $gte: startDate,
                    $lte: endDate
                },
                'bookings.status': { $in: ['booked', 'completed'] }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$bookings.createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $addFields: {
                _id: { $dateFromString: { dateString: '$_id' } }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ]);

    // 5. Generate full range of dates and merge with results
    const fullDateRange = [];
    let currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
        fullDateRange.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const result = fullDateRange.map((date) => {
        const found = bookingsCountonStartDateandEndDate.find(
            (item) => item._id.toISOString().split('T')[0] === date
        );
        return {
            _id: date,
            count: found ? found.count : 0
        };
    });

    // 6. Count vendor's staff
    const countStaff = await User.countDocuments({
        staffOf: vendorId
    });

    // 7. Return response
    const stats = serviceListingsCount[0] || {};

    res.status(200).json({
        status: 'success',
        data: {
            totalBookings: stats.totalBookings || 0,
            confirmedBookings: stats.confirmedBookings || 0,
            pendingBookings: stats.pendingBookings || 0,
            CancelledBookings: stats.CancelledBookings || 0,
            RejectedBookings: stats.RejectedBookings || 0,
            completedBookings: stats.completedBookings || 0,
            TotalServiceRevenue: totalEarnings,
            totalUniqueUsers: stats.totalUniqueUsers || 0,
            totalServiceListings: stats.totalServiceListings || 0,
            totalStaff: countStaff || 0,
        },
        chartdata: result
    });
});

const adminDashboard = catchAsync(async (req, res) => {
    let { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        const lastMonth = moment.utc().subtract(0, 'months');
        startDate = lastMonth.startOf('month').toDate();
        endDate = lastMonth.endOf('month').toDate();
    } else {
        startDate = moment.utc(startDate).startOf('day').toDate();
        endDate = moment.utc(endDate).endOf('day').toDate();
    }

    const dashboarddataforuser = await User.aggregate([
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                totalVendors: { $sum: { $cond: [{ $eq: ['$role', 'vendor'] }, 1, 0] } },
                totalVerifiedVendors: {
                    $sum: {
                        $cond: [{ $and: [{ $eq: ['$role', 'vendor'] }, { $eq: ['$status', 'Active'] }] }, 1, 0]
                    }
                },
                totalUnverifiedVendors: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$role', 'vendor'] },
                                    {
                                        $or: [{ $eq: ['$status', 'Inactive'] }, { $eq: ['$status', 'Suspend'] }]
                                    }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },
                newpandingVendors: {
                    $sum: {
                        $cond: [{ $and: [{ $eq: ['$role', 'vendor'] }, { $eq: ['$status', 'Pending'] }] }, 1, 0]
                    }
                },
                totalCustomers: { $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] } },
                totalActiveCustomers: {
                    $sum: {
                        $cond: [
                            { $and: [{ $eq: ['$role', 'customer'] }, { $eq: ['$status', 'Active'] }] },
                            1,
                            0
                        ]
                    }
                },
                totalInactiveCustomers: {
                    $sum: {
                        $cond: [
                            { $and: [{ $eq: ['$role', 'customer'] }, { $eq: ['$status', 'Inactive'] }] },
                            1,
                            0
                        ]
                    }
                },
                totalSuspendCustomers: {
                    $sum: {
                        $cond: [
                            { $and: [{ $eq: ['$role', 'customer'] }, { $eq: ['$status', 'Suspend'] }] },
                            1,
                            0
                        ]
                    }
                },
                totalDeleteUsers: { $sum: { $cond: [{ $eq: ['$status', 'Delete'] }, 1, 0] } }
            }
        }
    ]);

    const serviceListingsCount = await ServiceListing.aggregate([
        {
            $match: withSoftDeleteFilter({}, false)
        },
        {
            $group: {
                _id: null,
                totalServiceListings: { $sum: 1 }
            }
        }
    ]);

    const totalServiceRevenue = await Payout.aggregate([
        {
            $match: {
                status: 'Paid'
            }
        },
        {
            $group: {
                _id: null,
                totalServiceRevenue: { $sum: '$totalAmount' },

            }
        }
    ]);
    const totalNetRevenue = await Payment.aggregate([
        {
            $match: {
                status: 'completed'
            }
        },
        {
            $group: {
                _id: null,
                totalNetRevenue: { $sum: '$systemFee' },

            }
        }
    ]);



    const revenusForBarchart = await Payout.aggregate([
        {
            $match: {
                status: 'Paid',
                'createdAt': {
                    $gte: new Date(startDate), // Ensure the startDate is a Date object
                    $lte: new Date(endDate) // Ensure the endDate is a Date object
                }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                totalServiceRevenue: { $sum: '$totalAmount' }
            }
        }
    ])

    const lastLoginUsers = await User.aggregate([
        {
            $match: {

                lastLoginAt: { $exists: true, $ne: null },
                role: { $in: ['customer', 'vendor'] } // Filter for customers and vendors only
            }
        },
        {
            $sort: {
                lastLoginAt: -1
            } // Sort by lastLogin in descending order
        },
        {
            $limit: 10 // Limit to 10 users
        },
        {
            $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
                profilePicture: 1,
                lastLoginAt: 1
            }
        }
    ])

    console.log('lastLoginUsers', lastLoginUsers);

    const fullDateRange = [];
    let currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
        fullDateRange.push(currentDate?.toISOString().split('T')[0]); // Store date as string in format 'YYYY-MM-DD'
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const result = fullDateRange.map((date) => {
        const found = revenusForBarchart.find(
            (item) => item?._id === date
        );
        return {
            _id: date,
            count: found ? found.totalServiceRevenue : 0
        };
    });
  
    const countStaff = await Staff.countDocuments({
        staffOf:req.user._id,
        ...withSoftDeleteFilter({}, false)
    });

    res.status(200).json({
        status: 'success',
        data: {
            totalUsers: dashboarddataforuser[0]?.totalUsers || 0,
            totalVendors: dashboarddataforuser[0]?.totalVendors || 0,
            totalVerifiedVendors: dashboarddataforuser[0]?.totalVerifiedVendors || 0,
            totalUnverifiedVendors: dashboarddataforuser[0]?.totalUnverifiedVendors || 0,
            newpandingVendors: dashboarddataforuser[0]?.newpandingVendors || 0,
            totalCustomers: dashboarddataforuser[0]?.totalCustomers || 0,
            totalActiveCustomers: dashboarddataforuser[0]?.totalActiveCustomers || 0,
            totalServiceRevenue: totalServiceRevenue[0]?.totalServiceRevenue || 0,
            totalNetRevenue: totalNetRevenue[0]?.totalNetRevenue || 0,
            totalInactiveCustomers: dashboarddataforuser[0]?.totalInactiveCustomers || 0,
            serviceListings: serviceListingsCount[0]?.totalServiceListings || 0,
            totalStaff: countStaff || 0,
        },
        barchartdata: result,
        lastLoginUsers
    });
});

const getReportForAdmin = catchAsync(async (req, res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = withSoftDeleteFilter({}, false);

    if (req.query.serviceTypeId) {
        query.serviceTypeId = new mongoose.Types.ObjectId(req.query.serviceTypeId);
    }
    const [serviceListings, totalCount] = await Promise.all([
        ServiceListing.aggregate([
            { $match: { ...query } },
            {
                $lookup: {
                    from: 'bookings',
                    let: { serviceId: '$_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$service', '$$serviceId'] } } },
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalCompletedBookings: {
                                    $sum: { $cond: { if: { $eq: ['$_id', 'completed'] }, then: '$count', else: 0 } }
                                },
                                totalBookedBookings: {
                                    $sum: { $cond: { if: { $eq: ['$_id', 'booked'] }, then: '$count', else: 0 } }
                                },
                                totalPendingBookings: {
                                    $sum: { $cond: { if: { $eq: ['$_id', 'pending'] }, then: '$count', else: 0 } }
                                },
                                totalCancelledBookings: {
                                    $sum: { $cond: { if: { $eq: ['$_id', 'canceled'] }, then: '$count', else: 0 } }
                                },
                                totalRejectedBookings: {
                                    $sum: { $cond: { if: { $eq: ['$_id', 'rejected'] }, then: '$count', else: 0 } }
                                }
                            }
                        }
                    ],
                    as: 'completedBookings'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'vendorId',
                    foreignField: '_id',
                    as: 'vendor'
                }

            },
            { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },


            {
                $project: {
                    _id: 1,
                    title: 1,
                    media: 1,
                    "vendor._id": 1,
                    "vendor.firstName": 1,
                    "vendor.lastName": 1,
                    "vendor.email": 1,
                    "vendor.profilePicture": 1,
                    completedBookings: { $arrayElemAt: ['$completedBookings.totalCompletedBookings', 0] },
                    bookedBookings: { $arrayElemAt: ['$completedBookings.totalBookedBookings', 0] },
                    pendingBookings: { $arrayElemAt: ['$completedBookings.totalPendingBookings', 0] },
                    cancelledBookings: { $arrayElemAt: ['$completedBookings.totalCancelledBookings', 0] },
                    rejectedBookings: { $arrayElemAt: ['$completedBookings.totalRejectedBookings', 0] },
                    createdAt: 1,
                    updatedAt: 1
                }
            },
            { $skip: skip },
            { $limit: limit }
        ]),
        ServiceListing.countDocuments({})
    ]);

    res.status(200).json({
        status: 'success',
        data: {
            serviceListings,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: page
        }
    });

});
const monthlyvendorStats = catchAsync(async (req, res, next) => {
    const currentYear = new Date().getFullYear();
    const { id } = req.params;
    const selectedYear = parseInt(req.query.year) || currentYear;
    const results = await Bookings.aggregate([
        {
            $match: {
                status: { $in: ['booked', 'completed'] },
                checkIn: {
                    $gte: new Date(`${selectedYear}-01-01`),
                    $lt: new Date(`${selectedYear + 1}-01-01`)
                },
                ...withSoftDeleteFilter({}, false)
            }
        },
        {
            $lookup: {
                from: 'servicelistings',
                localField: 'service',
                foreignField: '_id',
                as: 'service'
            }
        },
        {
            $unwind: {
                path: '$service',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $match: {
                'service.vendorId': new mongoose.Types.ObjectId(id)
            }
        },
        {
            $project: {
                month: { $month: "$checkIn" },
                year: { $year: "$checkIn" },
                checkIn: 1,
                checkOut: 1,
                totalPrice: 1,
                status: 1,
                daysBooked: {
                    $divide: [
                        { $subtract: ["$checkOut", "$checkIn"] },
                        1000 * 60 * 60 * 24
                    ]
                }
            }
        },
        {
            $group: {
                _id: { year: "$year", month: "$month" },
                totalRevenue: { $sum: "$totalPrice" },
                totalDaysBooked: { $sum: "$daysBooked" },
                totalCompletedDays: {
                    $sum: {
                        $cond: [
                            { $eq: ["$status", "completed"] },
                            "$daysBooked",
                            0
                        ]
                    }
                },
                count: { $sum: 1 }
            }
        },
        {
            $addFields: {
                daysInMonth: {
                    $switch: {
                        branches: [
                            {
                                case: { $in: ["$_id.month", [1, 3, 5, 7, 8, 10, 12]] },
                                then: 31
                            },
                            {
                                case: { $in: ["$_id.month", [4, 6, 9, 11]] },
                                then: 30
                            },
                            {
                                case: { $eq: ["$_id.month", 2] },
                                then: {
                                    $cond: [
                                        {
                                            $or: [
                                                { $eq: [{ $mod: ["$_id.year", 400] }, 0] },
                                                {
                                                    $and: [
                                                        { $eq: [{ $mod: ["$_id.year", 4] }, 0] },
                                                        { $ne: [{ $mod: ["$_id.year", 100] }, 0] }
                                                    ]
                                                }
                                            ]
                                        },
                                        29,
                                        28
                                    ]
                                }
                            }
                        ],
                        default: 30
                    }
                }
            }
        },
        {
            $addFields: {
                averageRateBookedDay: {
                    $cond: [
                        { $gt: ["$daysInMonth", 0] },
                        {
                            $round: [
                                {
                                    $multiply: [
                                        { $divide: ["$totalDaysBooked", "$daysInMonth"] },
                                        100
                                    ]
                                },
                                2
                            ]
                        },
                        0
                    ]
                }
            }
        },
        {
            $sort: {
                "_id.year": 1,
                "_id.month": 1
            }
        }
    ]);

    const formattedResults = results.map(item => {
        const { year, month } = item._id;
        const date = new Date(year, month - 1);
        const monthName = date.toLocaleString('default', { month: 'long' });

        return {
            month,
            yearsOfMonth: `${monthName}, ${year}`,
            daysAvailable: item?.daysInMonth,
            daysBooked: Math.round(item?.totalDaysBooked),
            revenue: item?.totalRevenue,
            daysBookedCompleted: Math.round(item?.totalCompletedDays),
            averageRateBookedDay: item?.averageRateBookedDay || 0
        };
    });

    // Generate months for the full year
    const fullYearData = Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const date = new Date(selectedYear, index);
        const monthName = date.toLocaleString('default', { month: 'long' });

        // Check if data for this month exists in aggregation result
        const monthData = formattedResults.find(item => item.month === month);

        return monthData || {
            month,
            yearsOfMonth: `${monthName}, ${selectedYear}`,
            daysAvailable: new Date(selectedYear, month, 0).getDate(), // last day of month
            daysBooked: 0,
            revenue: 0,
            daysBookedCompleted: 0,
            averageRateBookedDay: 0
        };
    });

    // Remove `month` from final output if you don't want to send it
    const finalResult = fullYearData.map(({ month, ...rest }) => rest);

    res.status(200).json({ success: true, data: finalResult });


});
module.exports = {
    getReportForVendor,
    customerDashboard,
    vendorDashboard,
    adminDashboard,
    getReportForAdmin,
    monthlyvendorStats
};
