const Calendar = require('../models/Calendar');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { CalendarValidation } = require('../utils/joi/calendarValidation');
const joiError = require('../utils/joiError');
const Bookings = require('../models/Bookings');
const { createUserOAuthClient } = require('./googleOAuthController');
const { google } = require('googleapis');

// Get All Calendar Entries
const getAllCalendarEntries = catchAsync(async (req, res, next) => {
  const filterDate = req.query.filterdate;
  const search = (req.query.search || req.query.q || '').trim();

  // If no search term and no filterDate, return error
  if (!search && !filterDate) {
    return next(new AppError("Missing 'filterdate' in query", 400));
  }

  let firstDayOfMonth, lastDayOfMonth;
  
  // Only apply date filtering if there's no search term
  if (!search && filterDate) {
    const dateObj = new Date(filterDate);
    firstDayOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    lastDayOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
  }

  // Base query used for bookings aggregation
  const bookingQuery = {
    isDeleted: false,
    status: { $in: ['pending', 'booked', 'canceled', 'completed', 'rejected'] }
  };

  // Add date filter only if no search term
  if (!search && firstDayOfMonth && lastDayOfMonth) {
    bookingQuery.$or = [
      {
        checkIn: {
          $gte: firstDayOfMonth,
          $lte: lastDayOfMonth
        }
      },
      {
        checkOut: {
          $gte: firstDayOfMonth,
          $lte: lastDayOfMonth
        }
      }
    ];
  }

  // If vendor, restrict bookings to vendor's services
  if (req.user.role === 'vendor') {
    bookingQuery['serviceDetails.vendorId'] = req.user._id;
  }

  // Build search conditions (optional)
  let bookingMatch = { ...bookingQuery };
  let calendarSearchMatch = null;
  let searchRegex = null;
  if (search) {
    searchRegex = search; // used with $regex + $options below

    // For bookings: search on service title, booking user first/last name, reason, and status
    bookingMatch.$or = [
      { 'serviceDetails.title': { $regex: searchRegex, $options: 'i' } },
      { 'userDetails.firstName': { $regex: searchRegex, $options: 'i' } },
      { 'userDetails.lastName': { $regex: searchRegex, $options: 'i' } },
      { reason: { $regex: searchRegex, $options: 'i' } },
      { status: { $regex: searchRegex, $options: 'i' } },
      {
        $expr: {
          $regexMatch: {
            input: {
              $concat: [
                { $ifNull: ['$userDetails.firstName', ''] },
                ' ',
                { $ifNull: ['$userDetails.lastName', ''] }
              ]
            },
            regex: search,
            options: 'i'
          }
        }
      }
    ];

    // For calendar entries: we'll add a match stage after lookups (serviceDetails, vendorDetails)
    calendarSearchMatch = {
      $or: [
        { title: { $regex: searchRegex, $options: 'i' } },
        { reason: { $regex: searchRegex, $options: 'i' } },
        { 'serviceDetails.title': { $regex: searchRegex, $options: 'i' } },
        { 'vendorDetails.firstName': { $regex: searchRegex, $options: 'i' } },
        { 'vendorDetails.lastName': { $regex: searchRegex, $options: 'i' } },
        {
          $expr: {
            $regexMatch: {
              input: {
                $concat: [
                  { $ifNull: ['$vendorDetails.firstName', ''] },
                  ' ',
                  { $ifNull: ['$vendorDetails.lastName', ''] }
                ]
              },
              regex: search,
              options: 'i'
            }
          }
        }
      ]
    };
  }

  // Calendar entries aggregation (user's calendar entries within month)
  const entriesPipeline = [
    {
      $match: {
        userId: req.user._id
      }
    },
  ];

  // Add date filter only if no search term
  if (!search && firstDayOfMonth && lastDayOfMonth) {
    entriesPipeline[0].$match.$or = [
      {
        start: {
          $gte: firstDayOfMonth,
          $lte: lastDayOfMonth
        }
      },
      {
        end: {
          $gte: firstDayOfMonth,
          $lte: lastDayOfMonth
        }
      }
    ];
  }

  entriesPipeline.push(
    {
      $lookup: {
        from: 'servicelistings',
        localField: 'serviceId',
        foreignField: '_id',
        as: 'serviceDetails'
      }
    },
    {
      $unwind: {
        path: '$serviceDetails',
        preserveNullAndEmptyArrays: true
      }
    },
    // join vendor details so we can search by vendor name
    {
      $lookup: {
        from: 'users',
        localField: 'serviceDetails.vendorId',
        foreignField: '_id',
        as: 'vendorDetails'
      }
    },
    {
      $unwind: {
        path: '$vendorDetails',
        preserveNullAndEmptyArrays: true
      }
    }
  );

  // If vendor, restrict calendar entries to vendor's own services
  if (req.user.role === 'vendor') {
    entriesPipeline.push({
      $match: {
        'serviceDetails.vendorId': req.user._id
      }
    });
  }

  // If search is present, add search match
  if (calendarSearchMatch) {
    entriesPipeline.push({
      $match: calendarSearchMatch
    });
  }

  // Project fields
  entriesPipeline.push({
    $project: {
      _id: 1,
      start: 1,
      end: 1,
      title: 1,
      type: 1,
      reason: 1,
      servicename: '$serviceDetails.title',
      serviceimg: '$serviceDetails.media',

      extensionrequest: 1
    }
  });

  const entries = await Calendar.aggregate(entriesPipeline);

  // Bookings aggregation (bookings within month, with service/user details)
  const allbookings = await Bookings.aggregate([
    {
      $lookup: {
        from: 'servicelistings',
        localField: 'service',
        foreignField: '_id',
        as: 'serviceDetails'
      }
    },
    {
      $unwind: {
        path: '$serviceDetails',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userDetails'
      }
    },
    {
      $unwind: {
        path: '$userDetails',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: 'extensionbookings',
        localField: '_id',
        foreignField: 'bookingId',
        as: 'extensionrequest',
        pipeline: [{ $match: { request: 'pending' } }]
      }
    },
    {
      $unwind: { path: '$extensionrequest', preserveNullAndEmptyArrays: true }
    },
    {
      $match: bookingMatch
    },
    {
      $project: {
        _id: 1,
        start: '$checkIn',
        end: '$checkOut',
        userName: { $concat: ['$userDetails.firstName', ' ', '$userDetails.lastName'] },
        type: 'booking',
        reason: 1,
        serviceimg: '$serviceDetails.media',
        'bufferTimeUnit': '$serviceDetails.bufferTimeUnit',
        'bufferTime': '$serviceDetails.bufferTime',
        servicename: '$serviceDetails.title',
        servicePrice: '$serviceDetails.servicePrice',
        serviceId: '$serviceDetails._id',
        email: '$userDetails.email',
        userPhoto: '$userDetails.profilePicture',
        extensionrequest: 1,
        status: 1,
        totalPrice: 1
      }
    }
  ]);

  // Fetch Google Calendar events if connected
  let resEvent = {};
  if (req.user.googleCalendar?.isConnected) {
    try {
      const userOAuthClient = await createUserOAuthClient(req.user._id);
      const calendar = google.calendar({ version: 'v3', auth: userOAuthClient });
      
      const listParams = {
        calendarId: 'primary',
        singleEvents: true,
        orderBy: 'startTime'
      };

      // Only add time filters if no search term and date is provided
      if (!search && firstDayOfMonth && lastDayOfMonth) {
        listParams.timeMin = firstDayOfMonth.toISOString();
        listParams.timeMax = lastDayOfMonth.toISOString();
      }

      resEvent = await calendar.events.list(listParams);
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
    }
  }

  const events = resEvent?.data?.items || [];
  let formattedEvents = events.map((event) => ({
    id: event.id,
    title: event.summary,
    reason: event.description,
    start: event.start.dateTime || event.start.date,
    end: event.end.dateTime || event.end.date,
    location: event.location,
    status: event.status,
    type: 'google'
  }));

  // If a search term was provided, filter google events client-side by title/description/location
  if (search) {
    const regex = new RegExp(search, 'i');
    formattedEvents = formattedEvents.filter(
      (ev) =>
        (ev.title && regex.test(ev.title)) ||
        (ev.reason && regex.test(ev.reason)) ||
        (ev.location && regex.test(ev.location))
    );
  }

  return res.status(200).json({
    status: 'success',
    alldata: [...entries, ...allbookings, ...formattedEvents]
  });
});

// Create Calendar Entry
const createCalendarEntry = catchAsync(async (req, res, next) => {
  const { title, start, end, type, serviceId, reason } = req.body;

  const partialSchema = CalendarValidation.fork(['title', 'start', 'end', 'type'], (schema) =>
    schema.required()
  );

  const { error } = partialSchema.validate(req.body);
  if (error) {
    const errorFields = joiError(error);
    return next(new AppError('Validation failed', 400, { errorFields }));
  }

  const checkCalendar = await Calendar.findOne({
    $or: [
      {
        serviceId: serviceId,
        start: { $lte: new Date(end) },
        end: { $gte: new Date(start) }
      },
      {
        userId: req.user._id,
        start: { $lte: new Date(end) },
        end: { $gte: new Date(start) }
      }
    ]
  });
  const existingBooking = await Bookings.findOne({
    service: serviceId,
    status: { $in: ['pending', 'booked'] },
    $or: [
      {
        checkIn: { $lt: new Date(end) },
        checkOut: { $gt: new Date(start) }
      }
    ]
  });

  if (checkCalendar) {
    return next(
      new AppError('This service is already booked or reserved for the selected dates.', 400)
    );
  }
  if (existingBooking) {
    return next(new AppError('This service is already booked for the selected dates.', 400));
  }

  const newEntry = await Calendar.create({
    title,
    start,
    end,
    type,
    userId: req.user._id,
    serviceId,
    reason
  });

  res.locals.dataId = newEntry._id;
  return res.status(201).json({
    status: 'success',
    data: newEntry,
    message: 'Calendar entry created successfully'
  });
});

// Update Calendar Entry
const updateCalendarEntry = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { error } = CalendarValidation.validate(req.body);
  if (error) {
    const errorFields = joiError(error);
    return next(new AppError('Validation failed', 400, { errorFields }));
  }
  if (!id) {
    return next(new AppError('Please provide Calendar entry ID', 400));
  }

  const updatedEntry = await Calendar.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true
  });

  if (!updatedEntry) {
    return next(new AppError('No calendar entry found with that ID', 404));
  }

  res.locals.dataId = updatedEntry._id;
  return res.status(200).json({
    status: 'success',
    data: updatedEntry
  });
});

// Delete Calendar Entry
const deleteCalendarEntry = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError('Please provide Calendar entry ID', 400));
  }

  const deletedEntry = await Calendar.findByIdAndDelete(id);

  if (!deletedEntry) {
    return next(new AppError('No calendar entry found with that ID', 404));
  }

  res.locals.dataId = deletedEntry._id;
  return res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get Service Calendar (Reserved/Booked dates for a single service)
const getServiceCalendar = catchAsync(async (req, res, next) => {
  const { serviceId } = req.params;
  const { startMonth, endMonth } = req.query;

  // Validate required parameters
  if (!serviceId) {
    return next(new AppError('Service ID is required', 400));
  }

  if (!startMonth || !endMonth) {
    return next(new AppError('Start month and end month are required (format: YYYY-MM)', 400));
  }

  // Parse start month (first day of the month)
  const startMonthDate = new Date(startMonth);
  if (isNaN(startMonthDate.getTime())) {
    return next(new AppError('Invalid start month format. Use YYYY-MM', 400));
  }
  const start = new Date(startMonthDate.getFullYear(), startMonthDate.getMonth(), 1);

  // Parse end month (last day of the month)
  const endMonthDate = new Date(endMonth);
  if (isNaN(endMonthDate.getTime())) {
    return next(new AppError('Invalid end month format. Use YYYY-MM', 400));
  }
  const end = new Date(endMonthDate.getFullYear(), endMonthDate.getMonth() + 1, 0, 23, 59, 59, 999);

  // Validate date range
  if (start >= end) {
    return next(new AppError('End month must be after or equal to start month', 400));
  }

  // Get calendar blocks for this service within date range
  const calendarBlocks = await Calendar.find({
    serviceId: serviceId,
    $or: [
      {
        start: { $gte: start, $lte: end }
      },
      {
        end: { $gte: start, $lte: end }
      },
      {
        start: { $lte: start },
        end: { $gte: end }
      }
    ]
  }).select('start end title type reason');

  // Get bookings for this service within date range (only pending and booked status)
  const bookings = await Bookings.find({
    service: serviceId,
    isDeleted: false,
    status: { $in: [ 'booked','pending'] },
    $or: [
      {
        checkIn: { $gte: start, $lte: end }
      },
      {
        checkOut: { $gte: start, $lte: end }
      },
      {
        checkIn: { $lte: start },
        checkOut: { $gte: end }
      }
    ]
  })
    .select('checkIn checkOut status')
    .lean();

  // Format calendar blocks
  const formattedCalendarBlocks = calendarBlocks.map((block) => ({
    start: block.start,
    end: block.end,
    title: block.title,
    type: block.type || 'calendar',
    reason: block.reason,
    status: 'reserved'
  }));

  // Format bookings
  const formattedBookings = bookings.map((booking) => ({
    start: booking.checkIn,
    end: booking.checkOut,
    type: 'booking',
    status: booking.status
  }));

  // Combine all reserved dates
  const allReservedDates = [...formattedCalendarBlocks, ...formattedBookings];

  return res.status(200).json({
    status: 'success',
    results: allReservedDates.length,
    data: {
      serviceId,
      dateRange: {
        startMonth,
        endMonth,
        startDate: start,
        endDate: end
      },
      reservedDates: allReservedDates
    }
  });
});

module.exports = {
  getAllCalendarEntries,
  createCalendarEntry,
  updateCalendarEntry,
  deleteCalendarEntry,
  getServiceCalendar
};
