

const { default: mongoose } = require('mongoose');
const Bookings = require('../models/Bookings');
const Payments = require('../models/Payment');
const User = require('../models/users/User');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');
const { createStripeOnBoardingLink, createStripeExpressAccount, receiveAccount } = require('../utils/stripe-utils/connect-accounts.util');
const { maintoConnect } = require('../utils/stripe-utils/stripe-transfer.util');
const getAllpaymentsforVendor = catchAsync(async (req, res, next) => {

    const query = {
        vendorId: req.user._id
    };
    if (req.query.status) {
        query.status = req.query.status;
    }
    const apiFeature = new APIFeatures(Payments.find(query), req.query).paginate().sort();

    const [total, payments] = await Promise.all([
        Payments.countDocuments(query),
        apiFeature.query.populate("vendorId", ["email", "profileCompleted", "lastName", "firstName"]).populate({ path: "booking", populate: { path: "service", select: "title totalPrice" } })
    ]);

    const totalEarnings = await Payments.aggregate([
        { $match: { vendorId: req.user._id, status: 'completed' } },
        {
            $group: {
                _id: null,
                totalEarnings: { $sum: '$amount' }  // Sum the amount field
            }
        }
    ]);
    const totalEarningsValue = totalEarnings.length > 0 ? totalEarnings[0].totalEarnings : 0; // Get the total earnings value

    res.status(200).json({
        status: "success",
        data: payments,
        results: payments.length,
        totalPayments: total,
        totalEarnings: totalEarningsValue
    });
});
const getAllPayments = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const pipeline = [
        {
            $lookup: {
                from: 'users',
                localField: 'vendorId',
                foreignField: '_id',
                as: 'vendor'
            }
        },
        { $unwind: { path: '$vendor' } },
        {
            $addFields: {
                'vendor.fullName': {
                    $concat: [
                        { $ifNull: ['$vendor.firstName', ''] },
                        ' ',
                        { $ifNull: ['$vendor.lastName', ''] }
                    ]
                }
            }
        },
        {
            $match: {
                'vendor.role': { $ne: 'admin' }
            }
        },
        {
            $lookup: {
                from: 'bookings',
                localField: 'booking',
                foreignField: '_id',
                as: 'booking'
            }
        },
        { $unwind: { path: '$booking', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'servicelistings',
                localField: 'booking.service',
                foreignField: '_id',
                as: 'service'
            }
        },
        { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },

    ];
    // Add search filter if provided
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        pipeline.push({
            $match: {
                $or: [
                    { 'vendor.fullName': searchRegex },
                    { 'service.title': searchRegex }
                ]
            }
        });
    }

    // Add status filter if provided
    if (req.query.status) {
        pipeline.push({
            $match: { status: req.query.status }
        });
    }

    // Get total count
    const totalResult = await Payments.aggregate([
        ...pipeline,
        { $count: 'total' }
    ]);
    const total = totalResult[0]?.total || 0;

    // Get paginated results
    const payments = await Payments.aggregate([
        ...pipeline,
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
    ]);

    res.status(200).json({
        status: 'success',
        results: payments.length,
        totalPayments: total,
        data: payments
    });
});

////////////////////////////////payout to vendor from stripe main account to vendor connected account/////////////
const vendorPayout = catchAsync(async (req, res, next) => {

    const { amount, paymentId } = req.body; // amount in dollars

    const payment = await Payments.findOne({ _id: paymentId, status: 'pending' });
    if (!payment) {
        return next(new AppError('No payment found', 404));
    }

    const vendor = await User.findById(payment.vendorId);
    if (!vendor) {
        return next(new AppError('No vendor found with that ID', 404));
    }

    const findbooking = await Bookings.findOne({ _id: paymentId })

    if (!findbooking) {
        return next(new AppError('No booking found for this payment', 404));
    }

    if (amount && amount > findbooking.totalPrice) {
        return next(new AppError('Amount is greater than the total price of the booking', 400));
    }

    if (!vendor.stripeAccountId) {
        const accountId = await createStripeExpressAccount({
            email: vendor.email,
            country: vendor.countryName || 'US',
            userId: vendor._id
        });

        vendor.stripeAccountId = accountId;
        await vendor.save();

        const onboardingLink = await createStripeOnBoardingLink({
            accountId: vendor.stripeAccountId
        });

        const email = new Email(vendor.email, vendor.firstName);
        const message = `Hello ${vendor.firstName},<br><br>Your Stripe account is not ready for payouts. Please complete the onboarding process by clicking the link below:<br><br><a href="${onboardingLink}">${onboardingLink}</a><br><br>Thank you!`;
        await email.sendHtmlEmail('Stripe Account Onboarding', message, {
            link: onboardingLink
        });
        return next(new AppError('Vendor has no Stripe account linked.', 400));
    }

    const account = await receiveAccount(vendor.stripeAccountId);

    if (!account?.charges_enabled || !account.payouts_enabled) {
        const onboardingLink = await createStripeOnBoardingLink({
            accountId: vendor.stripeAccountId
        });

        const email = new Email(vendor.email, vendor.firstName);
        const message = `Hello ${vendor.firstName},<br><br>Your Stripe account is not ready for payouts. Please complete the onboarding process by clicking the link below:<br><br><a href="${onboardingLink}">${onboardingLink}</a><br><br>Thank you!`;
        await email.sendHtmlEmail('Stripe Account Onboarding', message, {
            link: onboardingLink
        });
        return next(new AppError('Vendor Stripe account is not ready for payouts.', 404));

    }


    let amountInCents = 0;
    let systemFee = 0;
    if (amount) {
        systemFee = findbooking.totalPrice - amount;
        amountInCents = Math.round(amount * 100);

    } else
        systemFee = findbooking.totalPrice - amount;
    amountInCents = Math.round(payment.amount * 100);

    try {
        const transfer = await maintoConnect({
            vendor: vendor,
            amountInCents: amountInCents
        });

        // Update payment status
        payment.amount = amountInCents / 100; // Store the amount in dollars
        payment.status = 'completed';
        payment.systemFee = systemFee;
        await payment.save();

        res.status(200).json({
            status: "success",
            data: transfer
        });
    } catch (error) {
        console.error('Stripe transfer error:', error);
        return next(new AppError('Failed to complete payout. Please try again.', 500));
    }
});

const getsinglecompletedbooking = catchAsync(async (req, res, next) => {

    const { bookingId } = req.params;
    const booking = await Bookings.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(bookingId),
                status: 'completed'

            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'customer'
            }
        },
        { $unwind: { path: '$customer', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'servicelistings',
                localField: 'service',
                foreignField: '_id',
                as: 'service'
            }
        },
        { $unwind: { path: '$service', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'users',
                localField: 'service.vendorId',
                foreignField: '_id',
                as: 'vendor'
            }
        },
        { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'payments',
                localField: '_id',
                foreignField: 'booking',
                as: 'payment'
            }
        },
        { $unwind: { path: '$payment', preserveNullAndEmptyArrays: true } },

    ]);


    if (booking.length === 0) {
        return next(new AppError('No booking found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: booking[0] // Return the first booking object
    });
});



module.exports = {
    getAllpaymentsforVendor,
    getAllPayments,
    vendorPayout,
    getsinglecompletedbooking
};
