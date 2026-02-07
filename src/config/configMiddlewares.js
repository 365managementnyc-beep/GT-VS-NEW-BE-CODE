const cors = require('cors');
const express = require('express');
const path = require('path');
const logger = require('morgan');
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const qs = require('qs');
// const autoDeleteOldPendingBookings = require('../jobs/autoDeleteOldPendingBookings');
// const updateBookingStatus = require('../jobs/updateBookingStatus');

module.exports = (app) => {
  const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };
  
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.use(xss());
  app.use(compression());
  app.use('/public', express.static(path.join(__dirname, '../public')));
  
  // Raw body parser for file uploads (PUT requests with binary data)
  app.use('/api/upload/chunk', express.raw({ type: '*/*', limit: '100mb' }));
  
  // JSON parser for regular API requests
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.set('query parser', (str) => qs.parse(str));
  if (process.env.NODE_ENV === 'development') {
    app.use(logger('dev'));
  }

  app.use(mongoSanitize());
  const limiter = rateLimit({
    max: 90000,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many requests from this IP, please try again in 15 mintues!'
  });
  app.use('/api', limiter);
  // app.use(
  //   hpp({
  //     whitelist: []
  //   })
  // );
  // Test middleware
  app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    next();
  });
};
