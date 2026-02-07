const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
const userModel = require('../models/users/User');

module.exports = function (passport) {
  // Only register Google strategy if credentials are provided
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Google OAuth credentials not configured, skipping Google strategy registration');
    return;
  }
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_REDIRECT_URI,
        passReqToCallback: true
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          console.log('Google Strategy callback invoked');
          console.log('Access Token received:', !!accessToken);
          console.log('Refresh Token received:', !!refreshToken);
          console.log('Profile received:', !!profile);
          console.log('Request query state:', req.query.state);
          
          const { linking, role } = JSON.parse(req.query.state || '{}');
          console.log('Parsed state - Linking:', linking, 'Role:', role);

          // Validate role early
          if (!["vendor", "customer"].includes(role)) {
            console.error('Invalid role detected:', role);
            return done('Invalid role, please sign up with a valid role (vendor or customer)', null);
          }

          const existingUser = await userModel.findOne({
            email: profile.emails[0].value
          });

          // Calculate token expiry date (Google tokens typically expire in 1 hour)
          const tokenExpiry = new Date(Date.now() + 3600 * 1000);

          // already present user must has the google provider in order for him to login
          if (existingUser) {
            console.log('Existing user found:', existingUser.fullName);
            if (linking) {
              // If linking, add Google to providers if not already linked
              if (!existingUser.providers.includes('google')) {
                existingUser.providers.push('google');
                existingUser.googleId = profile.id;
                existingUser.emailVerified = true;
                
                // Also connect calendar for linking
                if (accessToken) {
                  existingUser.googleCalendar = {
                    accessToken: accessToken,
                    refreshToken: refreshToken,
                    tokenExpiry: tokenExpiry,
                    isConnected: true,
                    connectedAt: new Date()
                  };
                  console.log('Calendar connected during linking');
                }
                
                await existingUser.save();
              }
              return done(null, existingUser);
            }
            if (!existingUser.providers.includes('google')) {
              return done(
               'This email is already registered . Please log in using your email and password  or facebook',
                null
              );
            }
            // set the googleId, emailVerified and save the user if not already done
            let needsUpdate = false;

            if (!existingUser.googleId) {
              existingUser.googleId = profile.id;
              needsUpdate = true;
            }

            if (!existingUser.emailVerified) {
              existingUser.emailVerified = true;
              needsUpdate = true;
            }

            // Auto-connect calendar if tokens are available and not already connected
            if (accessToken && !existingUser.googleCalendar?.isConnected) {
              existingUser.googleCalendar = {
                accessToken: accessToken,
                refreshToken: refreshToken,
                tokenExpiry: tokenExpiry,
                isConnected: true,
                connectedAt: new Date()
              };
              needsUpdate = true;
              console.log('Calendar auto-connected for existing user');
            }

            if (needsUpdate) {
              await existingUser.save();
            }
            return done(null, existingUser);
          }
          if (!["vendor", "customer"].includes(role)) {
            return done('Invalid role, please sign up with a valid role', null);
          }
          
          // Create new user with calendar connection
          const newUserData = {
            googleId: profile.id,
            firstName: profile?.name?.givenName || 'Unkown',
            lastName: profile?.name?.familyName || 'Unkown',
            role,
            email: profile.emails[0].value,
            emailVerified: true,
            profilePicture: profile?._json?.picture,
            providers: ['google']
          };

          // Add calendar connection if tokens are available
          if (accessToken) {
            newUserData.googleCalendar = {
              accessToken: accessToken,
              refreshToken: refreshToken,
              tokenExpiry: tokenExpiry,
              isConnected: true,
              connectedAt: new Date()
            };
            console.log('Calendar auto-connected for new user');
          }

          const newUser = await userModel.create(newUserData);
          console.log('New user created:', newUser.fullName);
          await newUser.save();
          return done(null, newUser);
        } catch (error) {
          console.log('error', error);
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log('inside serializeUser', user.firstName);
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    console.log('inside deserializeUser', id);
    try {
      const user = await userModel.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
