const { google } = require("googleapis")
const catchAsync = require("../utils/catchAsync")
const moment = require("moment-timezone")
const sendEmail = require("../utils/email")
const AppError = require("../utils/appError")
const User = require("../models/users/User")
const { createUserOAuthClient } = require("./googleOAuthController")

const path = require("path")
const serviceAccount = path.join(
  __dirname,
  "..",
  "..",
  "productlens-sso-calendar-3612f9718edc.json"
)

// Admin service account auth (for admin calendar access)
const adminAuth = new google.auth.GoogleAuth({
  keyFile: serviceAccount,
  scopes: [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/calendar"
  ]
})

const getAdminCalender = catchAsync(async (req, res, next) => {
  try {
    const calendar = google.calendar({ version: "v3", auth: adminAuth })

    const resEvent = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: "startTime"
    })
    console.log("my events", resEvent)
    const events = resEvent.data.items

    if (!events || events.length === 0) {
      console.log("No upcoming events found.")
      return res.status(200).json({
        status: "success",
        data: {
          message: "No upcoming events found.",
          events: []
        }
      })
    }

    const formattedEvents = events.map(event => ({
      id: event.id,
      summary: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date
    }))

    res.status(200).json({
      status: "success",
      data: {
        events: formattedEvents
      }
    })
  } catch (error) {
    console.error("Error fetching admin calendar:", error)
    res.status(500).json({
      status: "error",
      message: "Failed to fetch events",
      error: error.message
    })
  }
})

const scheduleMeeting = catchAsync(async (req, res, next) => {
  const { userEmail, selectedDate, selectedTime, timeZone } = req.body

  if (!userEmail || !selectedDate || !selectedTime || !timeZone) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields"
    })
  }
  try {
    // Use admin service account for scheduling meetings
    const calendar = google.calendar({ version: "v3", auth: adminAuth })
    const startMoment = moment.tz(
      `${selectedDate} ${selectedTime}`,
      "YYYY-MM-DD HH:mm",
      timeZone
    )
    const endMoment = startMoment.clone().add(1, "hour")

    const event = {
      summary: "Scheduled Meeting",
      description: `Meeting scheduled by ${userEmail}`,
      start: {
        dateTime: startMoment.toISOString(),
        timeZone: timeZone
      },
      end: {
        dateTime: endMoment.toISOString(),
        timeZone: timeZone
      },
      attendees: [{ email: userEmail }],
      conferenceData: {
        createRequest: {
          requestId: `req-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      },
      organizer: {
        email: `${process.env.GOOGLE_ADMIN_EMAIL}`
      }
    }
    console.log("event", event)
    console.log("insert calender:")
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1
    })

    console.log("Meeting scheduled successfully:", response.data)
    const meetLink = response.data.conferenceData?.entryPoints?.find(
      entry => entry.entryPointType === "video"
    )?.uri

    const userMeetingData = {
      time: startMoment.format("hh:mm A"),
      date: startMoment.format("YYYY-MM-DD")
    }

    const adminMoment = startMoment.clone().tz(process.env.ADMIN_TIMEZONE)
    const adminMeetingData = {
      time: adminMoment.format("hh:mm A"),
      date: adminMoment.format("YYYY-MM-DD")
    }

    await new sendEmail(userEmail, "", meetLink).sendMeetingLink(
      userMeetingData
    )
    await new sendEmail(
      process.env.GOOGLE_ADMIN_EMAIL,
      "",
      meetLink
    ).sendMeetingLink(adminMeetingData)

    const adminData = {
      email: process.env.GOOGLE_ADMIN_EMAIL,
      name: "Prodcut Lens"
    }

    res.status(201).json({
      status: "success",
      data: {
        meetLink,
        message: "Meeting scheduled successfully and notifications sent!",
        userData: adminData
      }
    })
  } catch (error) {
    console.error("Error scheduling meeting:", error.response?.data || error)
    res.status(500).json({
      status: "error",
      message: "Failed to schedule meeting",
      details: error.response?.data?.error || "Unknown error"
    })
  }
})

// Get vendor's personal calendar events
const getVendorCalendar = catchAsync(async (req, res, next) => {
  try {
    const { id: userId } = req.user // Assuming you have auth middleware

    // Create OAuth client for this vendor
    const userOAuthClient = await createUserOAuthClient(userId)
    const calendar = google.calendar({ version: "v3", auth: userOAuthClient })

    const { maxResults = 10, timeMin, timeMax } = req.query

    const resEvent = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults: parseInt(maxResults),
      singleEvents: true,
      orderBy: "startTime"
    })

    const events = resEvent.data.items

    console.log("Fetched vendor events:", resEvent.data)
    if (!events || events.length === 0) {
      return res.status(200).json({
        status: "success",
        data: {
          message: "No upcoming events found.",
          events: []
        }
      })
    }

    const formattedEvents = events.map(event => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location,
      attendees: event.attendees,
      status: event.status
    }))

    console.log("Formatted vendor events:", formattedEvents)

    res.status(200).json({
      status: "success",
      data: {
        events: formattedEvents,
        count: formattedEvents.length
      }
    })
  } catch (error) {
    console.error("Error fetching vendor calendar:", error)
    
    if (error.message === 'Google Calendar not connected') {
      return res.status(400).json({
        status: "error",
        message: "Please connect your Google Calendar first",
        code: "CALENDAR_NOT_CONNECTED"
      })
    }

    res.status(500).json({
      status: "error",
      message: "Failed to fetch calendar events",
      error: error.message
    })
  }
})

// Create event in vendor's calendar
const createVendorEvent = catchAsync(async (req, res, next) => {
  try {
    const { id:userId } = req.user
    const {
      summary,
      description,
      startDateTime,
      endDateTime,  
      timeZone = "UTC",
      attendees = [],
      location
    } = req.body

    if (!summary || !startDateTime || !endDateTime) {
      return next(new AppError("Missing required fields: summary, startDateTime, endDateTime", 400))
    }

    // Create OAuth client for this vendor
    const userOAuthClient = await createUserOAuthClient(userId)
    const calendar = google.calendar({ version: "v3", auth: userOAuthClient })

    const event = {
      summary,
      description,
      location,
      start: {
        dateTime: startDateTime,
        timeZone:  "UTC"
      },
      end: {
        dateTime: endDateTime,
        timeZone:  "UTC"
      },
      attendees: attendees.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `req-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      }
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1
    })

    const meetLink = response.data.conferenceData?.entryPoints?.find(
      entry => entry.entryPointType === "video"
    )?.uri

    res.status(201).json({
      status: "success",
      data: {
        event: response.data,
        meetLink,
        message: "Event created successfully"
      }
    })
  } catch (error) {
    console.error("Error creating vendor event:", error)
    
    if (error.message === 'Google Calendar not connected') {
      return res.status(400).json({
        status: "error",
        message: "Please connect your Google Calendar first",
        code: "CALENDAR_NOT_CONNECTED"
      })
    }

    res.status(500).json({
      status: "error",
      message: "Failed to create event",
      error: error.message
    })
  }
})

// Update event in vendor's calendar
const updateVendorEvent = catchAsync(async (req, res, next) => {
  try {
    const { userId } = req.user
    const { eventId } = req.params
    const updateData = req.body

    if (!eventId) {
      return next(new AppError("Event ID is required", 400))
    }

    // Create OAuth client for this vendor
    const userOAuthClient = await createUserOAuthClient(userId)
    const calendar = google.calendar({ version: "v3", auth: userOAuthClient })

    // First, get the existing event
    const existingEvent = await calendar.events.get({
      calendarId: "primary",
      eventId: eventId
    })

    // Merge existing data with updates
    const updatedEvent = {
      ...existingEvent.data,
      ...updateData,
      // Ensure proper datetime format for start/end if provided
      ...(updateData.startDateTime && {
        start: {
          dateTime: updateData.startDateTime,
          timeZone: updateData.timeZone || existingEvent.data.start.timeZone
        }
      }),
      ...(updateData.endDateTime && {
        end: {
          dateTime: updateData.endDateTime,
          timeZone: updateData.timeZone || existingEvent.data.end.timeZone
        }
      })
    }

    const response = await calendar.events.update({
      calendarId: "primary",
      eventId: eventId,
      resource: updatedEvent
    })

    res.status(200).json({
      status: "success",
      data: {
        event: response.data,
        message: "Event updated successfully"
      }
    })
  } catch (error) {
    console.error("Error updating vendor event:", error)
    
    if (error.message === 'Google Calendar not connected') {
      return res.status(400).json({
        status: "error",
        message: "Please connect your Google Calendar first",
        code: "CALENDAR_NOT_CONNECTED"
      })
    }

    res.status(500).json({
      status: "error",
      message: "Failed to update event",
      error: error.message
    })
  }
})

// Delete event from vendor's calendar
const deleteVendorEvent = catchAsync(async (req, res, next) => {
  try {
    const { id:userId } = req.user
    const { eventId } = req.params

    if (!eventId) {
      return next(new AppError("Event ID is required", 400))
    }

    // Create OAuth client for this vendor
    const userOAuthClient = await createUserOAuthClient(userId)
    const calendar = google.calendar({ version: "v3", auth: userOAuthClient })

    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId
    })

    res.status(200).json({
      status: "success",
      data: {
        message: "Event deleted successfully"
      }
    })
  } catch (error) {
    console.error("Error deleting vendor event:", error)
    
    if (error.message === 'Google Calendar not connected') {
      return res.status(400).json({
        status: "error",
        message: "Please connect your Google Calendar first",
        code: "CALENDAR_NOT_CONNECTED"
      })
    }

    res.status(500).json({
      status: "error",
      message: "Failed to delete event",
      error: error.message
    })
  }
})


// Schedule meeting in vendor's calendar
const scheduleVendorMeeting = catchAsync(async (req, res, next) => {
  const { userId } = req.user
  const { customerEmail, selectedDate, selectedTime, timeZone, summary, description } = req.body

  if (!customerEmail || !selectedDate || !selectedTime || !timeZone) {
    return next(new AppError("Missing required fields: customerEmail, selectedDate, selectedTime, timeZone", 400))
  }

  try {
    // Create OAuth client for this vendor
    const userOAuthClient = await createUserOAuthClient(userId)
    const calendar = google.calendar({ version: "v3", auth: userOAuthClient })
    
    const startMoment = moment.tz(
      `${selectedDate} ${selectedTime}`,
      "YYYY-MM-DD HH:mm",
      timeZone
    )
    const endMoment = startMoment.clone().add(1, "hour")

    const event = {
      summary: summary || "Customer Meeting",
      description: description || `Meeting with customer ${customerEmail}`,
      start: {
        dateTime: startMoment.toISOString(),
        timeZone: timeZone
      },
      end: {
        dateTime: endMoment.toISOString(),
        timeZone: timeZone
      },
      attendees: [{ email: customerEmail }],
      conferenceData: {
        createRequest: {
          requestId: `req-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      }
    }

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1
    })

    const meetLink = response.data.conferenceData?.entryPoints?.find(
      entry => entry.entryPointType === "video"
    )?.uri

    const meetingData = {
      time: startMoment.format("hh:mm A"),
      date: startMoment.format("YYYY-MM-DD")
    }

    // Send email notifications
    if (meetLink) {
      await new sendEmail(customerEmail, "", meetLink).sendMeetingLink(meetingData)
      
      // Get vendor email from user object (you might need to fetch this)
      const vendorUser = await User.findById(userId).select('email')
      if (vendorUser) {
        await new sendEmail(vendorUser.email, "", meetLink).sendMeetingLink(meetingData)
      }
    }

    res.status(201).json({
      status: "success",
      data: {
        event: response.data,
        meetLink,
        message: "Meeting scheduled successfully in your calendar!"
      }
    })
  } catch (error) {
    console.error("Error scheduling vendor meeting:", error)
    
    if (error.message === 'Google Calendar not connected') {
      return res.status(400).json({
        status: "error",
        message: "Please connect your Google Calendar first",
        code: "CALENDAR_NOT_CONNECTED"
      })
    }

    res.status(500).json({
      status: "error",
      message: "Failed to schedule meeting",
      error: error.message
    })
  }
})

module.exports = {
  getAdminCalender,
  scheduleMeeting,
  getVendorCalendar,
  createVendorEvent,
  updateVendorEvent,
  deleteVendorEvent,
  scheduleVendorMeeting
}