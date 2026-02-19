const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/users/User');


const requireCalendarConnection = catchAsync(async (req, res, next) => {
  const { id: userId } = req.user;

  const user = await User.findById(userId).select('googleCalendar.isConnected');
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (!user.googleCalendar?.isConnected) {
    return res.status(400).json({
      status: 'error',
      message: 'Google Calendar not connected. Please connect your calendar first.',
      code: 'CALENDAR_NOT_CONNECTED',
      data: { 
        connectUrl: '/api/calendar/google-auth/url'
      }
    });
  }

  next();
});



const requireVendorRole = (req, res, next) => {
  if (req.user.role !== 'vendor') {
    return next(new AppError('Access denied. Vendor role required.', 403));
  }
  next();
};

module.exports = {
  requireCalendarConnection,
  requireVendorRole
};
