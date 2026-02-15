const mongoose = require('mongoose');
// const populateNewsLetter = require('../utils/populateNewslettersetting');
// const populateAmenities = require('../utils/populateAmenities');
// const populateServiceCategory = require('../utils/poplateServiceCategory');
// const populateServiceGadgets = require('../utils/populateServiceGadgets');
// const populateNotificationSetting = require('../utils/NotificationSetting');
require('dotenv').config();
require('colors');

// Cache connection for serverless
let cachedConnection = null;
let cachedConnectionPromise = null;

//  connect MongoDB
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not set');
  }

  // Return cached connection if exists
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('Using cached MongoDB connection'.cyan.bold);
    return cachedConnection;
  }

  if (cachedConnectionPromise) {
    return cachedConnectionPromise;
  }

  try {
    cachedConnectionPromise = mongoose.connect(process.env.MONGO_URI, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1
    });

    const conn = await cachedConnectionPromise;
    
    cachedConnection = conn;
    cachedConnectionPromise = null;
    console.log('Connected to MongoDB'.green.bold);
    
    return conn;
    // populateAmenities()
    // populateServiceCategory()
    // populateServiceGadgets()
    // populateNotificationSetting()
    // populateNewsLetter()
  } catch (error) {
    cachedConnectionPromise = null;
    console.error('Error connecting to MongoDB:'.red.bold, error.message);
    throw error;
  }
};

module.exports = { connectDB };
