const catchAsync = require('../utils/catchAsync');
const Topic = require('../models/topic/Topic');
const Subtopic = require('../models/topic/Subtopic');
const AppError = require('../utils/appError');
const { topicSchema, subTopicSchema } = require('../utils/joi/topicValidation');
const joiError = require('../utils/joiError');

const createTopic = catchAsync(async (req, res, next) => {
    const { name, topicType } = req.body;

    const partialSchema = topicSchema.fork(["name", "topicType"], (schema) => schema.required());
    const { error } = partialSchema.validate(req.body, {
        abortEarly: false,
        allowUnknown: true
    });

    if (error) {
        const errorFields = joiError(error);
        return next(new AppError('Validation failed', 400, { errorFields }));
    }

    const topic = await Topic.create({
        name,
        topicType
    });
    res.locals.dataId = topic._id;
    res.status(200).json({
        status: 'success',
        data: topic,
        message: 'Topic created successfully'
    });
});

const createSubtopic = catchAsync(async (req, res, next) => {
    const { topicId, name, title, description } = req.body;
    const partialSchema = subTopicSchema.fork(["name", "title", "description", "topicId"], (schema) => schema.required());
    const { error } = partialSchema.validate(req.body, {
        abortEarly: false,
        allowUnknown: true
    });

    if (error) {
        const errorFields = joiError(error);
        return next(new AppError('Validation failed', 400, { errorFields }));
    }

    const subTopic = await Subtopic.create({
        topicId,
        name,
        title,
        description
    });
    res.locals.dataId = subTopic._id;
    res.status(200).json({
        status: 'success',
        data: subTopic,
        message: 'Subtopic created successfully'
    });
});

const getTopic = catchAsync(async (req, res, next) => {
    const topicId = req.params.topicId;
    const topic = await Topic.aggregate([
        {
            $match: { _id: topicId }
        },
        {
            $lookup: {
                from: 'subtopics',
                localField: '_id',
                foreignField: 'topicId',
                as: 'subtopics'
            }
        },
        {
            $unwind: {
                path: '$subtopics',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $match: {
                $or: [
                    { 'subtopics.isDeleted': { $ne: true } },
                    { 'subtopics': { $eq: null } }
                ]
            }
        },
        {
            $group: {
                _id: '$_id',
                name: { $first: '$name' },
                topicType: { $first: '$topicType' },
                subtopics: { $push: '$subtopics' }
            }
        }
    ]);

    if (!topic || topic.length === 0) {
        return next(new AppError('No topic found with that ID', 404));
    }

    res.status(200).json({
        status: 'success',
        data: topic[0]
    });
});
const getAllTopics = catchAsync(async (req, res, next) => {

    const { topicType } = req.query;
    const filter = topicType ? { topicType: topicType } : {};
    const topics = await Topic.aggregate([
        {
            $match: { isDeleted: false,...filter }
        },
        {
            $lookup: {
                from: 'subtopics',
                let: { topicId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$topicId', '$$topicId'] },
                                    { $eq: ['$isDeleted', false] }
                                ]
                            }
                        }
                    }
                ],
                as: 'subtopics'
            }
        },
        {
            $project: {
                name: 1,
                topicType: 1,
                subtopics: 1
            }
        }
    ])
        .sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        data: topics
    });
});

getsubTopics = catchAsync(async (req, res, next) => {
    const topicId = req.params.topicId;
    const subtopics = await Subtopic.aggregate([
        {
            $match: { topicId: mongoose.Types.ObjectId(topicId), isDeleted: false }
        },
        {
            $lookup: {
                from: 'topics',
                localField: 'topicId',
                foreignField: '_id',
                as: 'topic'
            }
        },
        {
            $unwind: "$topic",
            preserveNullAndEmptyArrays: true
        },
        {
            $
        }
    ]);
    if (!subtopics || subtopics.length === 0) {
        return next(new AppError('No subtopics found for this topic', 404));
    }
    res.status(200).json({
        status: 'success',
        data: subtopics
    });

})
const updateTopic = catchAsync(async (req, res, next) => {
    const { error } = topicSchema.validate(req.body, {
        abortEarly: false,
        allowUnknown: true
    });

    if (error) {
        const errorFields = joiError(error);
        return next(new AppError('Validation failed', 400, { errorFields }));
    }
    const topic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!topic) {
        return next(new AppError('No topic found with that ID', 404));
    }
    res.locals.dataId = topic._id; // Store the ID of the created FAQ in res.locals
    res.status(200).json({
        status: 'success',
        data: topic
    });
});
const updateSubtopic = catchAsync(async (req, res, next) => {
    const { error } = subTopicSchema.validate(req.body, {
        abortEarly: false,
        allowUnknown: true
    });

    if (error) {
        const errorFields = joiError(error);
        return next(new AppError('Validation failed', 400, { errorFields }));
    }
    const subtopic = await Subtopic.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!subtopic) {
        return next(new AppError('No subtopic found with that ID', 404));
    }
    res.locals.dataId = subtopic._id; // Store the ID of the created FAQ in res.locals
    res.status(200).json({
        status: 'success',
        data: subtopic
    });
});

const deleteTopic = catchAsync(async (req, res, next) => {
    const topic = await Topic.findByIdAndUpdate(req.params.id, { isDeleted: true }, {
        new: true
    });
    if (!topic) {
        return next(new AppError('No topic found with that ID', 404));
    }
    res.locals.dataId = topic._id; // Store the ID of the deleted topic in res.locals
    res.status(204).json({
        status: 'success',
        data: null
    });
})

const deleteSubtopic = catchAsync(async (req, res, next) => {
    const subtopic = await Subtopic.findByIdAndUpdate(req.params.id, { isDeleted: true }, {
        new: true
    });
    if (!subtopic) {
        return next(new AppError('No subtopic found with that ID', 404));
    }
    res.locals.dataId = subtopic._id; // Store the ID of the deleted topic in res.locals
    res.status(204).json({
        status: 'success',
        data: null
    });
})

module.exports = {
    createTopic,
    getTopic,
    getAllTopics,
    updateTopic,
    deleteTopic,
    createSubtopic,
    updateSubtopic,
    deleteSubtopic
};


