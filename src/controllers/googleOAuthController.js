const { google } = require("googleapis")
const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/appError")
const User = require("../models/users/User")
const crypto = require("crypto")

// OAuth 2.0 configuration - uses the same callback as auth
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI // Same as auth callback
)

// Generate OAuth URL for vendor to authorize calendar access
const getGoogleAuthUrl = catchAsync(async (req, res, next) => {
  const { id: userId } = req.user // Assuming you have user authentication middleware
  console.log('Generating Google OAuth URL for user:', userId, req.user?.googleCalendar)

  // Check if user already has calendar connected
  const user = await User.findById(userId).select('googleCalendar.isConnected');
  if (user?.googleCalendar?.isConnected) {
    return res.status(200).json({
      status: 'success',
      data: {
        message: 'Google Calendar is already connected',
        isConnected: true
      }
    });
  }

  // Generate a state parameter with calendar-only flag and user info
  const state = JSON.stringify({
    isCalendarOnly: true,
    userId: userId,
    timestamp: Date.now()
  });

  console.log('Generated OAuth state for calendar-only:', state)

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // To get refresh token
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar'
    ],
    state: state,
    prompt: 'consent' // Force consent screen to get refresh token
  })

  res.status(200).json({
    status: 'success',
    data: {
      authUrl,
      message: 'Redirect user to this URL to authorize calendar access'
    }
  })
})

// Handle OAuth callback for both login and calendar connection
const handleGoogleCallback = catchAsync(async (req, res, next) => {
  const { code, state } = req.query
  console.log('OAuth callback received:', { code: !!code, state })
  
  // Parse the state parameter to check if this is calendar-only
  let stateData = {};
  try {
    stateData = JSON.parse(state || '{}');
  } catch (error) {
    console.log('Failed to parse state, treating as login:', error.message);
    stateData = {};
  }
  
  console.log('Parsed state data:', stateData);
  
  // Check if this is a calendar-only connection (separate from login)
  const isCalendarOnly = stateData.isCalendarOnly || false;
  
  if (isCalendarOnly) {
    // Handle calendar-only connection
    console.log('Handling calendar-only callback');
    return handleCalendarOnlyCallback(req, res, next);
  } else {
    // This is coming from the main login flow
    console.log('This appears to be a login callback, not calendar-only');
    return next(new AppError('This callback should be handled by the auth login flow', 400));
  }
})

// Disconnect Google Calendar
const disconnectGoogleCalendar = catchAsync(async (req, res, next) => {
  const { id:userId } = req.user

  await User.findByIdAndUpdate(userId, {
    'googleCalendar.accessToken': null,
    'googleCalendar.refreshToken': null,
    'googleCalendar.tokenExpiry': null,
    'googleCalendar.isConnected': false,
    'googleCalendar.connectedAt': null
  })

  res.status(200).json({
    status: 'success',
    data: {
      message: 'Google Calendar disconnected successfully'
    }
  })
})

// Get Google Calendar connection status
const getCalendarConnectionStatus = catchAsync(async (req, res, next) => {
  const { userId } = req.user

  const user = await User.findById(userId).select('googleCalendar.isConnected googleCalendar.connectedAt')
  
  if (!user) {
    return next(new AppError('User not found', 404))
  }

  res.status(200).json({
    status: 'success',
    data: {
      isConnected: user.googleCalendar?.isConnected || false,
      connectedAt: user.googleCalendar?.connectedAt || null
    }
  })
})

// Check if user's calendar was auto-connected during Google login
const checkAutoConnectedCalendar = catchAsync(async (req, res, next) => {
  const { userId } = req.user

  const user = await User.findById(userId).select('googleCalendar providers')
  
  if (!user) {
    return next(new AppError('User not found', 404))
  }

  const isGoogleUser = user.providers?.includes('google')
  const isCalendarConnected = user.googleCalendar?.isConnected || false

  res.status(200).json({
    status: 'success',
    data: {
      isGoogleUser,
      isCalendarConnected,
      connectedAt: user.googleCalendar?.connectedAt || null,
      message: isCalendarConnected 
        ? 'Calendar is connected' 
        : isGoogleUser 
          ? 'Google user but calendar not connected'
          : 'Not a Google user'
    }
  })
})

// Refresh expired access token
const refreshAccessToken = async (userId) => {
  try {
    const user = await User.findById(userId).select('+googleCalendar.refreshToken +googleCalendar.accessToken')
    
    if (!user.googleCalendar?.refreshToken) {
      throw new Error('No refresh token available')
    }

    oauth2Client.setCredentials({
      refresh_token: user.googleCalendar.refreshToken
    })

    const { credentials } = await oauth2Client.refreshAccessToken()
    
    // Update user with new access token
    const tokenExpiry = new Date(Date.now() + (credentials.expiry_date || 3600 * 1000))
    
    await User.findByIdAndUpdate(userId, {
      'googleCalendar.accessToken': credentials.access_token,
      'googleCalendar.tokenExpiry': tokenExpiry
    })

    return credentials.access_token
  } catch (error) {
    console.error('Token refresh error:', error)
    throw error
  }
}

// Create OAuth client for a specific user
const createUserOAuthClient = async (userId) => {
  const user = await User.findById(userId).select('+googleCalendar.accessToken +googleCalendar.refreshToken googleCalendar.tokenExpiry googleCalendar.isConnected')
  
  if (!user.googleCalendar?.isConnected) {
    throw new AppError('Google Calendar not connected', 400)
  }

  // Check if token is expired
  const now = new Date()
  const tokenExpiry = new Date(user.googleCalendar.tokenExpiry)
  
  let accessToken = user.googleCalendar.accessToken

  if (now >= tokenExpiry) {
    // Token is expired, refresh it
    accessToken = await refreshAccessToken(userId)
  }

  const userOAuthClient = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  userOAuthClient.setCredentials({
    access_token: accessToken,
    refresh_token: user.googleCalendar.refreshToken
  })

  return userOAuthClient
}

// Handle calendar-only OAuth callback (separate from login)
const handleCalendarOnlyCallback = catchAsync(async (req, res, next) => {
  const { code, state } = req.query
  let stateData = JSON.parse(state || '{}');
  console.log('Calendar-only callback received:', { code: !!code, state })
  
  if (!code) {
    return next(new AppError('Authorization code not provided', 400))
  }

  console.log('State data for calendar-only:2374328735678367356375683565783', stateData)
  // Get userId from state data
  const userId = stateData.userId;
  if (!userId) {
    return next(new AppError('User ID not found in state', 400))
  }

  try {
    // Exchange authorization code for tokens
    console.log('Attempting to exchange code for tokens (calendar-only)...')
    const { tokens } = await oauth2Client.getToken(code)
    console.log('Tokens received:', { 
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date
    })

    // Calculate token expiry date
    const tokenExpiry = new Date(Date.now() + (tokens.expiry_date || 3600 * 1000))

    // Update user with OAuth tokens
    await User.findByIdAndUpdate(userId, {
      'googleCalendar.accessToken': tokens.access_token,
      'googleCalendar.refreshToken': tokens.refresh_token,
      'googleCalendar.tokenExpiry': tokenExpiry,
      'googleCalendar.isConnected': true,
      'googleCalendar.connectedAt': new Date()
    })

    console.log('Calendar connected successfully for user:', userId)
    delete req.session.userId
    delete req.session.isCalendarOnly

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL}/calendar/connected?success=true`)
  } catch (error) {
    console.error('Calendar OAuth callback error:', {
      message: error.message,
      code: error.code,
      response: error.response?.data
    })
    // Redirect to frontend with error
    res.redirect(`${process.env.FRONTEND_URL}/calendar/connected?error=${encodeURIComponent(error.message)}`)
  }
})

module.exports = {
  getGoogleAuthUrl,
  handleGoogleCallback,
  disconnectGoogleCalendar,
  getCalendarConnectionStatus,
  checkAutoConnectedCalendar,
  createUserOAuthClient,
  refreshAccessToken
}
