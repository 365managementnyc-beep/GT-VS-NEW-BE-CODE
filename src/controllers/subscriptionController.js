const stripe = require('../config/stripe');
const mongoose = require('mongoose');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const calculateExpiryDate = require('../utils/calculateExpiryDate');
const getPermissionsByUserType = require('../utils/getPermissionsByUserType');

const getPlanPrice = (plan, duration) => {
  switch (duration) {
    case 'monthly':
      return plan.planPrice.monthly;
    case 'quarterly':
      return plan.planPrice.quarterly;
    case 'semiAnnual':
      return plan.planPrice.semiAnnual;
    case 'annual':
      return plan.planPrice.annual;
    case 'biennial':
      return plan.planPrice.biennial;
    default:
      throw new AppError('Invalid plan duration', 400);
  }
};

const buySubscription = catchAsync(async (req, res, next) => {
  const { planId, duration } = req.body;
  const { user } = req;

  console.log('Received planId:', user, planId, duration);

  const plan = await Plan.findById(planId);
  if (!plan) {
    console.error(`Plan ID ${planId} not found in Plan collection`);
    return next(new AppError('Invalid plan ID', 400));
  }

  const price = getPlanPrice(plan, duration);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: plan.planType,
            description: `Subscription plan for ${duration}`
          },
          unit_amount: Math.round(Number(price) * 100)
        },
        quantity: 1
      }
    ],
    mode: 'payment',
    success_url: `${req.protocol}://${req.get('host')}/subscription/success`,
    cancel_url: `${req.protocol}://${req.get('host')}/subscription/cancel`,
    metadata: {
      userId: user._id.toString(),
      planId: plan._id.toString(),
      duration
    }
  });

  return res.status(200).json({
    status: 'success',
    message: 'Checkout session created successfully',
    sessionId: session.id,
    url: session.url
  });
});

const handleCheckoutSession = catchAsync(async (req, res, next) => {
  const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
  const { metadata } = session;

  const { userId } = metadata;
  const { planId } = metadata;
  const { duration } = metadata;

  const plan = await Plan.findById(planId);
  if (!plan) {
    return next(new AppError('Invalid plan ID', 400));
  }

  const expiryDate = calculateExpiryDate(duration);

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const subscription = new Subscription({
      userId,
      userType: plan.planType,
      type: 'premium',
      plan: plan.planFor,
      startDate: new Date(),
      expiryDate,
      isActive: true,
      verifiedBadge: true,
      permissions: getPermissionsByUserType(plan.planType, plan.planType)
    });

    await subscription.save({ session: mongoSession });

    await mongoSession.commitTransaction();
    mongoSession.endSession();

    return res.status(200).json({
      status: 'success',
      message: 'Subscription purchased successfully',
      data: subscription
    });
  } catch (error) {
    await mongoSession.abortTransaction();
    mongoSession.endSession();
    return next(new AppError('Subscription purchase failed', 500));
  }
});

const upgradeSubscription = catchAsync(async (req, res, next) => {
  const { planId, paymentMethodId, duration } = req.body;
  const userId = req.user._id;

  const plan = await Plan.findById(planId);
  if (!plan) {
    console.error(`Plan ID ${planId} not found in Plan collection`);
    return next(new AppError('Invalid plan ID', 400));
  }

  const price = getPlanPrice(plan, duration);
  if (price > 0) {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price * 100,
      currency: 'eur',
      payment_method: paymentMethodId,
      confirm: true
    });

    if (paymentIntent.status !== 'succeeded') {
      return next(new AppError('Payment failed', 400));
    }
  }

  const expiryDate = calculateExpiryDate(duration);

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const subscription = await Subscription.findOneAndUpdate(
      { userId },
      {
        userType: plan.planType,
        type: price > 0 ? 'premium' : 'free',
        plan: plan.planFor,
        startDate: new Date(),
        expiryDate,
        isActive: true,
        verifiedBadge: price > 0,
        permissions: getPermissionsByUserType(plan.planType, plan.planType)
      },
      { new: true, upsert: true, session: mongoSession }
    );

    await mongoSession.commitTransaction();
    mongoSession.endSession();

    return res.status(200).json({
      status: 'success',
      message: 'Subscription upgraded successfully',
      data: subscription
    });
  } catch (error) {
    await mongoSession.abortTransaction();
    mongoSession.endSession();
    return next(new AppError('Subscription upgrade failed', 500));
  }
});

const cancelSubscriptionPurchase = catchAsync(async (req, res) => {
  res.status(200).json({
    status: 'cancelled',
    message: 'Subscription purchase was cancelled'
  });
});

const getSubscriptionStatus = catchAsync(async (req, res) => {
  const userId = req.user._id;

  const subscription = await Subscription.findOne({ userId });

  if (!subscription) {
    return res.status(200).json({
      status: 'success',
      message: 'User is on a free plan',
      data: {
        type: 'free',
        permissions: getPermissionsByUserType(req.user.role, 'free')
      }
    });
  }

  return res.status(200).json({
    status: 'success',
    data: subscription
  });
});

const cancelSubscription = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const userType = req.user.role;

  const subscription = await Subscription.findOne({ userId });
  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  const permissions = getPermissionsByUserType(userType, 'free');

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    subscription.type = 'free';
    subscription.plan = 'free';
    subscription.startDate = null;
    subscription.expiryDate = null;
    subscription.isActive = false;
    subscription.verifiedBadge = false;
    subscription.permissions = permissions;

    await subscription.save({ session: mongoSession });

    await mongoSession.commitTransaction();
    mongoSession.endSession();

    return res.status(200).json({
      status: 'success',
      message: 'Subscription cancelled and downgraded to free',
      data: subscription
    });
  } catch (error) {
    await mongoSession.abortTransaction();
    mongoSession.endSession();
    return next(new AppError('Subscription cancellation failed', 500));
  }
});

const rewardPremium = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const userType = req.user.role;

  const subscription = await Subscription.findOne({ userId });
  if (!subscription) {
    return next(new AppError('Subscription not found', 404));
  }

  const permissions = getPermissionsByUserType(userType, 'premium');
  permissions.handsUpLimit = 1;

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    subscription.type = 'premium';
    subscription.plan = 'daily';
    subscription.startDate = new Date();
    subscription.expiryDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    subscription.isActive = true;
    subscription.permissions = permissions;

    await subscription.save({ session: mongoSession });

    await mongoSession.commitTransaction();
    mongoSession.endSession();

    return res.status(200).json({
      status: 'success',
      message: 'User rewarded with 1-day premium subscription',
      data: subscription
    });
  } catch (error) {
    await mongoSession.abortTransaction();
    mongoSession.endSession();
    return next(new AppError('Rewarding premium subscription failed', 500));
  }
});

const checkPremiumAccess = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const subscription = await Subscription.findOne({
    userId,
    type: 'premium',
    expiryDate: { $gt: new Date() }
  });

  if (!subscription) {
    return next(new AppError('Access denied. Upgrade to premium to access this feature.', 403));
  }

  req.subscription = subscription;
  return next();
});

const checkSubscription = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const subscription = await Subscription.findOne({ userId });

  if (!subscription) {
    return next(new AppError('Access denied. Upgrade to premium to access this feature.', 403));
  }

  req.subscription = subscription;
  return next();
});

// const getPermissionsByUserType = (userType, plan) => {
//   const permissions = {
//     student: {
//       free: { ads: true, storageLimit: 1, maxTopicsPerDay: 3, customization: false, handsUpLimit: 1, gifsEnabled: false, priorityVisibility: false },
//       premium: { ads: false, storageLimit: 4, maxTopicsPerDay: 10, customization: true, handsUpLimit: 1, gifsEnabled: true, priorityVisibility: true }
//     },
//     musician: {
//       free: { ads: true, storageLimit: 1, maxTopicsPerDay: 3, customization: false, handsUpLimit: 1, gifsEnabled: false, priorityVisibility: false },
//       essential: { ads: false, storageLimit: 5, maxTopicsPerDay: 10, customization: true, handsUpLimit: 2, gifsEnabled: true, priorityVisibility: true },
//       professional: { ads: false, storageLimit: 10, maxTopicsPerDay: 20, customization: true, handsUpLimit: 3, gifsEnabled: true, priorityVisibility: true }
//     },
//     contractor: {
//       free: { ads: true, storageLimit: 1, maxTopicsPerDay: 3, customization: false, handsUpLimit: 1, gifsEnabled: false, priorityVisibility: false },
//       essential: { ads: false, storageLimit: 5, maxTopicsPerDay: 10, customization: true, handsUpLimit: 2, gifsEnabled: true, priorityVisibility: true },
//       professional: { ads: false, storageLimit: 10, maxTopicsPerDay: 20, customization: true, handsUpLimit: 3, gifsEnabled: true, priorityVisibility: true }
//     }
//   };

//   return permissions[userType][plan];
// };

// const calculateExpiryDate = (duration) => {
//   let date = new Date();
//   switch (duration) {
//     case 'monthly':
//       date.setMonth(date.getMonth() + 1);
//       break;
//     case 'quarterly':
//       date.setMonth(date.getMonth() + 3);
//       break;
//     case 'semiAnnual':
//       date.setMonth(date.getMonth() + 6);
//       break;
//     case 'annual':
//       date.setFullYear(date.getFullYear() + 1);
//       break;
//     case 'biennial':
//       date.setFullYear(date.getFullYear() + 2);
//       break;
//     default:
//       throw new AppError('Invalid plan duration', 400);
//   }
//   return date;
// };

module.exports = {
  getSubscriptionStatus,
  upgradeSubscription,
  cancelSubscription,
  rewardPremium,
  checkPremiumAccess,
  checkSubscription,
  buySubscription,
  handleCheckoutSession,
  cancelSubscriptionPurchase
};
