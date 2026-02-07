require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/connectDb');
const configMiddlewares = require('./config/configMiddlewares');
const routes = require('./config/routes');

// Disable cron jobs for serverless deployment (Vercel)
// These should be run via Vercel Cron Jobs or external schedulers
// require("./utils/updateRequest");
// require("./utils/VendorPayout");
// require("./utils/checkstripebalance");
// require("./utils/PayoutCrone");
// require("./utils/autoDeleteOldPendingBookings");


const app = express();

// Health check route - must be first
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Gala Tab API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
 
app.set('trust proxy', 1);
// Configure middlewares
configMiddlewares(app);

// setting the session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'SESSION_SECRET_FALLBACK',
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      sameSite: 'lax' // Important for OAuth redirects
    },
    name: 'gala-tab-session' // Custom session name
  })
);


// initialize passport
app.use(passport.initialize());
app.use(passport.session());

// loading authentication strategies(Google, Facebook) - wrapped in try-catch
try {
  require('./auth/GoogleStrategy')(passport);
  require("./auth/FacebookStrategy")(passport);
} catch (error) {
  console.error('Error loading auth strategies:', error.message);
}

// Debug middleware to log session data
app.use((req, res, next) => {
  if (req.url.includes('/auth/') || req.url.includes('/calendar/')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', JSON.stringify(req.session, null, 2));
    console.log('Cookies:', req.headers.cookie);
    console.log('---');
  }
  next();
});

// Initialize routes
routes(app);

// Connect to database (non-blocking for serverless)
connectDB().catch(err => {
  console.error('MongoDB connection error:', err.message);
});

// Start server only in non-serverless environment
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;







