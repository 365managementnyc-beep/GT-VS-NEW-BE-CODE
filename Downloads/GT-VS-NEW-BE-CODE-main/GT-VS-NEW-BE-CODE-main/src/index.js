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
// Updated: Force redeploy to apply file upload fix
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'Gala Tab API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.1'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

// MongoDB connection test endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    
    if (connectionState !== 1) {
      // Try to connect if not connected
      await connectDB();
    }
    
    // Test a simple query
    const Admin = require('./models/users/Admin');
    const adminCount = await Admin.countDocuments({});
    
    res.status(200).json({ 
      status: 'success',
      message: 'MongoDB connection successful',
      connection: {
        state: states[connectionState] || 'unknown',
        stateCode: connectionState,
        host: mongoose.connection.host,
        database: mongoose.connection.db?.databaseName
      },
      test: {
        adminCount: adminCount,
        querySuccessful: true
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'fail',
      message: 'MongoDB connection failed',
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
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

// Passport serialization (required for sessions)
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// loading authentication strategies(Google, Facebook) - wrapped in try-catch
try {
  require('./auth/GoogleStrategy')(passport);
  require("./auth/FacebookStrategy")(passport);
} catch (error) {
  console.error('Error loading auth strategies:', error.message);
}

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







