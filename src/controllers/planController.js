const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Plan = require('../models/Plan');

const createPlan = catchAsync(async (req, res, next) => {
  const { planType, planPrice, planFor, features, courseId, timeDuration } = req.body;

  // Validate required fields
  if (!planType || !planPrice || !planFor) {
    return next(new AppError('Please provide planType, planPrice, and planFor.', 400));
  }

  // Validate planFor value
  if (!['course', 'musician', 'contractor'].includes(planFor)) {
    return next(
      new AppError("Invalid value for planFor. Must be 'course', 'musician', or 'contractor'.", 400)
    );
  }

  // If planFor is 'course', validate courseId
  if (planFor === 'course' && !courseId) {
    return next(new AppError("courseId is required when planFor is 'course'.", 400));
  }

  // Create a new plan
  const newPlan = await Plan.create({
    planType,
    planPrice,
    planFor,
    features,
    courseId: planFor === 'course' ? courseId : undefined,
    timeDuration
  });

  return res.status(201).json({
    status: 'success',
    message: 'Plan created successfully',
    data: newPlan
  });
});

// Get all plans
const getPlans = catchAsync(async (req, res) => {
  const plans = await Plan.find();
  res.status(200).json({
    status: 'success',
    results: plans.length,
    data: plans
  });
});

// Get plans by planFor
const getPlansByPlanFor = catchAsync(async (req, res, next) => {
  const { planFor } = req.params;
  const { courseId } = req.query; // Extract courseId from query parameters

  // Validate planFor value
  if (!['course', 'musician', 'contractor'].includes(planFor)) {
    return next(
      new AppError("Invalid value for planFor. Must be 'course', 'musician', or 'contractor'.", 400)
    );
  }

  // Filter plans by planFor and optionally by courseId if planFor is 'course'
  const filter = { planFor };
  if (planFor === 'course' && courseId) {
    filter.courseId = courseId;
  }

  const plans = await Plan.find(filter);

  return res.status(200).json({
    status: 'success',
    results: plans.length,
    data: plans
  });
});

// Update a plan
const updatePlan = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { planType, planPrice, planFor, features, courseId, timeDuration } = req.body;

  // Find the plan and update it
  const updatedPlan = await Plan.findByIdAndUpdate(
    id,
    {
      planType,
      planPrice,
      planFor,
      features,
      courseId: planFor === 'course' ? courseId : undefined, // Only update courseId if planFor is 'course'
      timeDuration
    },
    { new: true, runValidators: true }
  );

  if (!updatedPlan) {
    return next(new AppError('No plan found with this ID.', 404));
  }

  return res.status(200).json({
    status: 'success',
    message: 'Plan updated successfully',
    data: updatedPlan
  });
});

// Delete a plan
const deletePlan = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const deletedPlan = await Plan.findByIdAndDelete(id);

  if (!deletedPlan) {
    return next(new AppError('No plan found with this ID.', 404));
  }

  return res.status(204).json({
    status: 'success',
    message: 'Plan deleted successfully',
    data: null
  });
});

module.exports = {
  deletePlan,
  updatePlan,
  getPlansByPlanFor,
  getPlans,
  createPlan
};
