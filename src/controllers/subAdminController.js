
const { PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber');
const Subadmin = require('../models/users/Admin');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const { Adminschema } = require('../utils/joi/subAdminValidation');
const { validateAndFormatPhoneNumber } = require('../utils/helperFunctions');

const phoneUtil = PhoneNumberUtil.getInstance();
const { roles } = require('../utils/types');
const { sendEmail } = require('./authController');
const joiError = require('../utils/joiError');
const { getPDFBuffer, getExcelBuffer } = require('../utils/pdfandexcel');


const updateAdmin = catchAsync(async (req, res, next) => {
    // Find user
    const userFound = await Subadmin.findById(req.params.id).select('+password');
    if (!userFound) {
        return next(new AppError('User not found', 404));
    }

    // Validate fields present in request body
    const { error } = Adminschema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
        const errorFields = joiError(error);
        return next(new AppError('Validation failed', 400, errorFields));
    }

    const {

        firstName,
        lastName,
        profilePicture,
        contact,
        countryCode,
        templateId,
        tasks,
        status
    } = req.body;

    const updateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;
    if (templateId !== undefined) updateFields.templateId = templateId;
    if (tasks) updateFields.tasks = tasks;
    if (status) updateFields.status = status;
    // Validate and format phone number if provided
    try {
        if (contact !== undefined) {
            if (contact) {
                updateFields.contact = validateAndFormatPhoneNumber(
                    contact,
                    countryCode || userFound.countryCode
                );
                if (countryCode !== undefined) {
                    updateFields.countryCode = countryCode;
                }
            } else {
                updateFields.contact = ''; // allow clearing contact
            }
        }
    } catch (err) {
        return next(new AppError(err.message, 400));
    }

    // Update user only with provided fields
    Object.assign(userFound, updateFields);
    await userFound.save();

    res.locals.dataId = userFound._id; // Store the ID of the updated user in res.locals

    return res.status(200).json({
        status: 'success',
        message: 'Profile updated successfully',
        data: userFound
    });
});

const CreateSubAdmin = catchAsync(async (req, res, next) => {
    const updateData = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        profilePicture: req.body.profilePicture,
        templateId: req.body.templateId,
        tasks: req.body.tasks
    }
    const validationSchema = Adminschema.fork(["profilePicture", "lastName", "firstName", "templateId", "email", "password", "templateId", "tasks"], (schema) => schema.required());
    const { error } = validationSchema.validate(req.body, { abortEarly: false, allowUnknown: true });

    if (error) {

        const errorFields = joiError(error);
        return next(new AppError('Validation failed', 400, errorFields));
    }

    const { email, contact, countryCode } = req.body;

    let normalizedContact;
    let regionCode;

    try {
        const countryDialCode = parseInt(countryCode.replace('+', ''), 10);
        regionCode = phoneUtil.getRegionCodeForCountryCode(countryDialCode);
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
    const existingUsers = await Subadmin.findOne({
        $or: [{ email }, { contact: normalizedContact }]
    });

    if (existingUsers) {
        if (existingUsers.email === email) {
            return next(new AppError('Email already exists!', 400, { email: 'Email already exists!' }));
        }
        if (existingUsers.contact === normalizedContact) {

            return next(new AppError('Contact already exists!', 400, { contact: 'Contact already exists!' }));
        }
    }

    // Prepare user data
    const UserData = {
        ...updateData,
        email,
        contact: normalizedContact,
        countryCode,
        role: roles.ADMIN,
        contactVerified: true,
        emailVerified: true,
        kycCompleted: true,
        staffOf: req.user.staffOf || req.user._id
    };

    const user = await Subadmin.create(UserData);


    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Optionally store in Redis if needed
    // await redisClient.setEx(`resetPassword:${user._id}`, 10 * 60, resetToken);

    // Generate reset URL with token
    const origin = req.get('origin') || process.env.FRONTEND_URL;

    // Ensure correct reset URL based on request origin
    const resetURL = `${origin}/auth/reset-password?token=${resetToken}`;

    // const resetURL = `${req.protocol}://${req.get('host')}/reset-password?token=${resetToken}`;

    console.log('Reset URL:', resetURL);

    // Send password reset email
    try {
        await sendEmail('forgotEmail', 'Reset Your Password', email, {
            firstName: user.firstName,
            resetURL
        });

        res.locals.dataId = user._id; // Store the ID of the created user in res.locals
        return res.status(200).json({
            status: 'success',
            message: '  Admin created successfully',
            data: user
        });
    } catch (err) {
        console.log(err);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('There was an error sending the email. Try again later!'), 500);
    }

});


const Resetpassword = catchAsync(async (req, res, next) => {
    const { password } = req.body;
    const { userId } = req.params;


    // console.log(req?.user?.adminRole,"this is admin role")
    // if (req?.user?.adminRole !== "admin") {
    //     return next(new AppError('You do not have permission to perform this action', 400));

    // }


    // let decoded;

    if (!password || !userId) {
        const fieldErrors = {
            password: password ? undefined : 'Password is required .',
            userId: userId ? undefined : 'userId is required in params.'
        };
        return next(new AppError('Validation failed', 400, fieldErrors));
    }




    const user = await Subadmin.findOne({
        _id: userId
    }).select('+password');

    if (!user) {
        return next(new AppError('Invalid request.', 404, { user: 'user not found' }));
    }

    if (user && user?.status === "Delete") {
        return next(new AppError('This account deleted by Admin. Please contact with Admin', 404));
    }


    if (user && user?.status === "Suspend" || user?.status === "Inactive") {
        return next(new AppError('This account Suspend by Admin. Please contact with Admin', 401));
    }
    if (await user.comparePasswords(password, user.password)) {
        const fieldErrors = {
            password: 'Your new password must be different from the current one.'
        };
        return next(new AppError('Validation failed', 400, fieldErrors));
    }

    user.password = password;
    user.passwordChangedAt = Date.now();
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.locals.dataId = user._id; // Store the ID of the updated user in res.locals

    return res.json({ success: true, message: 'Password updated successfully' });
});

const adminDashboard = catchAsync(async (req, res, next) => {
    const user = await Subadmin.findById(req.user._id).populate("templateId")
        .populate({
            path: 'tasks',
            populate: {
                path: 'assignedby',
                model: 'User'
            }
        }).select('+password');
    if (!user) {
        return next(new AppError('User not found', 404));
    }
    return res.status(200).json({
        status: 'success',
        message: "Welcome to the dashboard",
        data: user
    });
});


const formatData = (data) => {
    return data.map((item) => ({
        name: `${item.firstName} ${item.lastName}`,
        email: item.email,
        contact: item.contact,
        status: item.status,
        templateName: item.templateId ? item.templateId.templateName : 'N/A',
    }));
};

const exportPayoutBufferforSubAdmin = catchAsync(async (req, res, next) => {
    const { type } = req.query;
    if (!type || (type !== 'pdf' && type !== 'excel')) {
        return next(new AppError('Invalid type', 400));
    }
    const users = await Subadmin.find({
        adminRole: 'subAdmin'
    }).populate('templateId', 'templateName')


    const data = formatData(users);
    let buffer, base64, dataUrl;


    if (type === 'pdf') {
        const columns = [
            { label: 'Full Name', key: 'name', width: 100 },
            { label: 'Primary Role', key: 'templateName', width: 100 },
            { label: 'Email', key: 'email', width: 140 },
            { label: 'Phone Number', key: 'contact', width: 130 },
            { label: 'Status', key: 'status', width: 100 },

        ];
        buffer = await getPDFBuffer(data, columns, 'Sub Admins');
        base64 = buffer.toString('base64');
        dataUrl = `data:application/pdf;base64,${base64}`;
    } else {
        const columnforexcel = [
            { label: 'Full Name', key: 'name', width: 20 },
            { label: 'Primary Role', key: 'templateName', width: 30 },
            { label: 'Email', key: 'email', width: 30 },
            { label: 'Phone Number', key: 'contact', width: 30 },
            { label: 'Status', key: 'status', width: 20 },

        ];
        buffer = await getExcelBuffer(data, columnforexcel, 'Sub Admins');
        base64 = buffer.toString('base64');
        dataUrl = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`;
    }

    res.status(200).json({
        status: 'success',
        dataUrl
    });
});
module.exports = {
    updateAdmin,
    CreateSubAdmin,
    Resetpassword,
    adminDashboard,
    exportPayoutBufferforSubAdmin

};
