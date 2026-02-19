const mongoose = require('mongoose');
const NotificationPermission = require('../models/NotificationPermission');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const getAllNotifications = catchAsync(async (req, res, next) => {

    const NotificationPermissions = await NotificationPermission.find()
    return res.status(200).json({
        status: "success",
        totalpermissions: NotificationPermissions.length,
        data: NotificationPermissions
    });
});

const updateMultipleNotifications = catchAsync(async (req, res, next) => {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
        return next(new AppError('Updates are required and must be an array of objects', 400));
    }

    // Each item should be: { _id: 'notificationId', update: { field: value } }
    const updatePromises = updates.map((update) =>
        NotificationPermission.findByIdAndUpdate(update._id, update, {
            new: true,
            runValidators: true
        })
    );

    const updatedNotifications = await Promise.all(updatePromises);

    return res.status(200).json({
        status: "success",
        message: 'Notifications updated successfully',
        data: updatedNotifications
    });
});

module.exports = {
    getAllNotifications,
    updateMultipleNotifications
};

