const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber');
const Staff = require('../models/users/Staff');
const APIFeatures = require('../utils/apiFeatures');
const StaffSchema = require('../utils/joi/staffValidation');
const joiError = require('../utils/joiError');
const Customer = require('../models/users/Customer');
const Vendor = require('../models/users/Vendor');
const User = require('../models/users/User');
const Email = require('../utils/email');
const { default: mongoose } = require('mongoose');
const phoneUtil = PhoneNumberUtil.getInstance();
const sendEmailforVendor = async (template, subject, email, data) => {
  const response = await new Email(email, subject).send(template, subject, data);
  return response;
};

const getAllStaff = catchAsync(async (req, res, next) => {
  console.log(req.query, 'req.query');
  const apifeatures = new APIFeatures(User.find({ staffOf: new mongoose.Types.ObjectId(req.params.id) }), req.query).paginate();
  const [staffMembers, totalStaff] = await Promise.all([
    apifeatures.query,
    User.countDocuments({ staffOf: new mongoose.Types.ObjectId(req.params.id) })
  ]);
  res.status(200).json({
    status: 'success',
    totalStaff,
    data: staffMembers
  });
});

const createStaff = catchAsync(async (req, res, next) => {
  const { email, contact, countryCode } = req.body;
  const updateData = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    profilePicture: req.body.profilePicture,
    permissions: req.body.permissions,
    staffRole: req.body.staffRole
  };

  const partialSchema = StaffSchema.fork(
    ['email', 'contact', 'countryCode', 'password', 'permissions'],
    (schema) => schema.required()
  );
  const { error } = partialSchema.validate(req.body, { abortEarly: false, allowUnknown: true });

  if (error) {
    const errorFields = joiError(error);
    return next(new AppError('Validation failed', 400, errorFields));
  }
  let normalizedContact;
  let regionCode;

  try {
    const countryDialCode = parseInt(countryCode.replace('+', ''), 10);
    regionCode = phoneUtil.getRegionCodeForCountryCode(countryDialCode);

    console.log('regionCode', regionCode);
    if (!regionCode) throw new Error('Invalid country code.');

    const number = phoneUtil.parseAndKeepRawInput(contact, regionCode);
    if (!phoneUtil.isValidNumber(number) || !phoneUtil.isValidNumberForRegion(number, regionCode)) {
      throw new Error('Invalid phone number for the specified country.');
    }
    normalizedContact = phoneUtil.format(number, PhoneNumberFormat.E164);
  } catch (err) {
    return next(new AppError('Validation failed', 400, { contact: err.message }));
  }

  // Check if email or contact already exists
  const existingUsers = await User.findOne({
    $or: [{ email }, { contact: normalizedContact }]
  });

  if (existingUsers) {
    if (existingUsers.email === email) {
      return next(
        new AppError('Email already exists!', 400, {
          email: 'Email already exists!'
        })
      );
    }
    if (existingUsers.contact === normalizedContact) {
      return next(
        new AppError('Contact number already exists!', 400, {
          contact: 'Contact number already exists!'
        })
      );
    }
  }
  const UserData = { ...updateData, contact: normalizedContact, countryCode };

  let user;

  if (req.user.role === 'customer') {
    UserData.staffOf = req.user._id;
    UserData.customerRole = 'staff';
    user = await Customer.create(UserData);
  } else {
    UserData.staffOf = req.user._id;
    UserData.vendorRole = 'staff';
    user = await Vendor.create(UserData);
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const origin = req.get('origin') || process.env.FRONTEND_URL;
  const resetURL = `${origin}/auth/reset-password?token=${resetToken}`;

  await sendEmailforVendor('forgotEmail', 'Reset Your Password', email, {
    firstName: user.firstName,
    resetURL
  });

  res.locals.dataId = user._id; // Store the ID of the created user in res.locals
  return res.status(200).json({
    status: 'success',
    message: 'Staff created successfully',
    data: user
  });
});

const updateStaff = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  console.log('updates', updates);

  const { error } = StaffSchema.validate(updates, { abortEarly: false, allowUnknown: true });
  const findStaff = await User.findById(id);
  

  if (error) {
    const errorFields = joiError(error);
    return next(new AppError('Validation failed', 400, errorFields));
  }
  let updatedStaff;

  if (req.user.role === 'vendor' || (findStaff.role==='vendor'&& req.user.role==='admin')) {
    updatedStaff = await Vendor.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });
  } else if (req.user.role === 'customer' || (findStaff.role==='vendor'&& req.user.role==='admin')) {
    updatedStaff = await Customer.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });
  }
  if (!updatedStaff) {
    return next(new AppError('No staff found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: updatedStaff
  });
});

const deleteStaff = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const deletedStaff = await User.findOneAndDelete(
    { _id: id, staffOf: req.user._id }
  );

  
  if (!deletedStaff) {
    return next(new AppError('No staff found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});

//////////////////////////////////////get user staff members///////////////////////////////////////
const getUserStaff = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  
  // Build base query
  let query = { staffOf: req.user._id };
  
  // Add search filter if provided
  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search, 'i');
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { contact: searchRegex },
      { staffRole: searchRegex },
      {
        $expr: {
          $regexMatch: {
            input: { $concat: ['$firstName', ' ', '$lastName'] },
            regex: search,
            options: 'i'
          }
        }
      }
    ];
  }
  
  const apifeatures = new APIFeatures(User.find(query), req.query).paginate();
  const [staffMembers, totalStaff] = await Promise.all([
    apifeatures.query,
    User.countDocuments(query)
  ]);
  
  res.status(200).json({
    status: 'success',
    totalStaff,
    data: staffMembers
  });
});
module.exports = {
  getAllStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  getUserStaff
};
