const Newsletter = require('../models/Newsletter');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Email = require('../utils/email');
const NewsletterSettings = require('../models/NewLetterPermission');
const { normalizeIsDeleted, withSoftDeleteFilter } = require('../utils/softDeleteFilter');

const sendEmail = async (subject, email, text, data) => {
    await new Email(email, subject).sendTextEmail(subject, text, data);
};
const createNewsletter = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    if (!email) {
        return next(new AppError('Please provide email', 400, { email: "Email is required" }));
    }

    const existingNewsletter = await Newsletter.findOne({ email });
    if (existingNewsletter) {
        return next(new AppError('This email already exist in Newsletter', 400));
    }

    const newNewsletter = await Newsletter.create({ email });

    res.locals.dataId = newNewsletter._id;
    return res.status(201).json({
        status: 'success',
        data: newNewsletter
    });
});


const getAllNewsletters = catchAsync(async (req, res) => {
    const { search } = req.query;
    const isDeleted = normalizeIsDeleted(req.query.isDeleted);
    let query = {};
    if (search) {
        query.$or = [
            { email: { $regex: search, $options: 'i' } }
        ];
    }
    query = withSoftDeleteFilter(query, isDeleted);
    const features = new APIFeatures(Newsletter.find(query), req.query).paginate();
    const newsletters = await features.query;
    const totalNewsletters = await Newsletter.countDocuments(query);

    return res.status(200).json({
        status: 'success',
        results: newsletters.length,
        totalNewsletters,
        data: newsletters
    });
});

const deleteNewsletter = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        return next(new AppError('Please provide id', 400));
    }

    const deletedNewsletter = await Newsletter.findOneAndUpdate({ _id: id }, { isDeleted: true }, { new: true });

    if (!deletedNewsletter) {
        return next(new AppError('No newsletter found with that ID', 404));
    }

    res.locals.dataId = deletedNewsletter._id;

    return res.status(204).json({
        status: 'success',
        data: null
    });
});


const sendNewsletter = catchAsync(async (req, res, next) => {
    const { selectedIds, text } = req.body;
    
    if (!text) {
        return next(new AppError('Please provide text', 400));
    }

    let newsletters;
    let selectedIdsArray;
    if (Array.isArray(selectedIds)) {
        selectedIdsArray = selectedIds;
    } else {
        selectedIdsArray = [selectedIds];
    }
    if (selectedIdsArray.length) {
        newsletters = await Newsletter.find({ _id: { $in: selectedIdsArray }, isDeleted: false });
    } else {
        newsletters = await Newsletter.find({ isDeleted: false });
    }

    if (!newsletters.length) {
        return next(new AppError('No newsletters found', 404));
    }

    await Promise.all(newsletters.map(async (newsletter) => {
        await sendEmail('Inform', newsletter.email, text);
    }));

    return res.status(200).json({
        status: 'success',
        message: 'Newsletter sent successfully'
    });
});
////////////////////////edit newsletter settings///////////////////
const eitpermissionforNewsletter = catchAsync(async (req, res, next) => {
  const {permissions }= req.body;

  if (!Array.isArray(permissions) || permissions.length === 0) {
    return next(new AppError('A non-empty array of updates is required', 400));
  }

  const bulkOperations = permissions.map((item) => ({
    updateOne: {
      filter: { _id: item._id },
      update: { $set: { permission: item.permission , status: item.status} },
      upsert: false
    }
  }));

  const result = await NewsletterSettings.bulkWrite(bulkOperations);

  return res.status(200).json({
    status: 'success',
    message: 'Newsletter settings updated successfully',
    modifiedCount: result.modifiedCount
  });
});

const getNewsletterSettings = catchAsync(async (req, res, next) => {
    const newsletterSettings = await NewsletterSettings.find({});

    return res.status(200).json({
        status: 'success',
        data: newsletterSettings
    });
});

module.exports = {
    createNewsletter,
    getAllNewsletters,
    deleteNewsletter,
    sendNewsletter,
    eitpermissionforNewsletter,
    getNewsletterSettings
};

