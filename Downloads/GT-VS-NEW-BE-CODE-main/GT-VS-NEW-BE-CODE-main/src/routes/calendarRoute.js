const express = require('express');
const { 
 getAllCalendarEntries,
    createCalendarEntry,
    updateCalendarEntry,
    deleteCalendarEntry,
    getServiceCalendar
} = require('../controllers/calendarController');
const {
  getGoogleAuthUrl,
  disconnectGoogleCalendar,
  getCalendarConnectionStatus,
  checkAutoConnectedCalendar
} = require('../controllers/googleOAuthController');
const {
  getAdminCalender,
  scheduleMeeting,
  getVendorCalendar,
  createVendorEvent,
  updateVendorEvent,
  deleteVendorEvent,
  scheduleVendorMeeting
} = require('../controllers/googlecalendarController');
const requireAuth = require('../middlewares/requireAuth');
const restrictTo = require('../middlewares/restrictTo');
const logActionMiddleware = require('../middlewares/logActionMiddleware');
const subAuth = require('../middlewares/subAuth');
const { requireCalendarConnection } = require('../middlewares/calendarMiddleware');


const router = express.Router();

// Existing calendar routes
router
  .route('/')
  .post(requireAuth, restrictTo(['admin',"vendor"]), logActionMiddleware("Create Calendar Entry", "Calendar"),subAuth, createCalendarEntry)
  .get(requireAuth, restrictTo(['admin',"vendor"]), getAllCalendarEntries);

router.route('/:id')
  .delete(requireAuth, restrictTo(['admin',"vendor"]), logActionMiddleware("Delete Calendar Entry", "Calendar"), subAuth, deleteCalendarEntry)
  .patch(requireAuth, restrictTo(['admin',"vendor"]), logActionMiddleware("Update Calendar Entry", "Calendar"), subAuth, updateCalendarEntry);

// Get service calendar (reserved/booked dates for a single service)
router.get('/service/:serviceId', getServiceCalendar);

// Google Calendar OAuth routes 
router.get('/google-auth/url', requireAuth, getGoogleAuthUrl);
// Note: Callback is now handled by /api/auth/login/google/callback (unified)
router.delete('/google-auth/disconnect', requireAuth, disconnectGoogleCalendar);
router.get('/google-auth/status', requireAuth, getCalendarConnectionStatus);
router.get('/google-auth/check-auto-connected', requireAuth, checkAutoConnectedCalendar);

// Admin Google Calendar routes (existing functionality)
router.get('/admin/events', requireAuth, restrictTo(['admin']), getAdminCalender);
router.post('/admin/schedule-meeting', requireAuth, restrictTo(['admin']), scheduleMeeting);

// Vendor Google Calendar routes (new functionality) - with calendar connection check
router.get('/vendor/events', requireAuth, requireCalendarConnection, getVendorCalendar);
router.post('/vendor/events', requireAuth, requireCalendarConnection, createVendorEvent);
router.put('/vendor/events/:eventId', requireAuth, requireCalendarConnection, updateVendorEvent);
router.delete('/vendor/events/:eventId', requireAuth, requireCalendarConnection, deleteVendorEvent);
router.post('/vendor/schedule-meeting', requireAuth, requireCalendarConnection, scheduleVendorMeeting);

module.exports = router;  