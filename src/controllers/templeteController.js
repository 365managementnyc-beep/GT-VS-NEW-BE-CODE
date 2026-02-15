
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError')
const { Permission, Task } = require('../models/Templete'); // Assuming you have a Templete model
const { templeteValidation,tasktempleteValidation } = require('../utils/joi/templeteValidation');
const joiError = require('../utils/joiError');
const APIFeatures = require('../utils/apiFeatures');
const { normalizeIsDeleted, withSoftDeleteFilter } = require('../utils/softDeleteFilter');




/// //////////////////////////////////////permissions controller///////////////////////////////////////
const getTempletes = catchAsync(async (req, res) => {
 
    const { search } = req.query;
    const isDeleted = normalizeIsDeleted(req.query.isDeleted);
    const searchQuery = search ? { templateName: { $regex: search, $options: 'i' } } : {};
    const query = withSoftDeleteFilter(searchQuery, isDeleted);
    const APIFeature = new APIFeatures(Permission.find(query), req.query).paginate();
    const templetes = await APIFeature.query;
    const totalTempletes = await Permission.countDocuments(query);

    res.json({
        templetes,
        totalTempletes,
        success: true,
        message: 'Templetes fetched successfully'
    });

});
const getTempleteNames = catchAsync(async (req, res) => {

    const isDeleted = normalizeIsDeleted(req.query.isDeleted);
    const templates = await Permission.find(withSoftDeleteFilter({}, isDeleted)).select('templateName');

    res.status(200).json({
        templates,
        success: true,
        message: 'Templetes fetched successfully'
    });

});

const getTempleteById = catchAsync(async (req, res) => {
    const templete = await Permission.findById(req.params.id);
    if (templete) {
        res.json(templete);
    } else {
        res.status(404);
        throw new Error('Templete not found');
    }
});


const createTempletePermission = catchAsync(async (req, res, next) => {
    const { templateName, tabPermissions } = req.body;
    const partialSchema = templeteValidation.fork(["templateName", "tabPermissions"], (schema) => schema.required());
    const { error } = partialSchema.validate(req.body, {
        abortEarly: false
    });

    if (error) {
        const errorFields = joiError(error);
        return next(new AppError('Validation failed', 400, { errorFields }));
    }

    const templete = new Permission({
        templateName,
        tabPermissions
    });
    res.locals.dataId = templete._id; // Store the ID of the created FAQ in res.locals
    const createdTemplete = await templete.save();
    res.status(202).json({ createdTemplete, success: true, message: 'Templete created successfully' });
});


const updateTemplete = catchAsync(async (req, res, next) => {
    const { error } = templeteValidation.validate(req.body, {
        abortEarly: false,
        allowUnknown: true
    });

    if (error) {
        const errorFields = joiError(error);
        return next(new AppError('Validation failed', 400, { errorFields }));
    }



    const templete = await Permission.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    res.locals.dataId = templete._id; // Store the ID of the created FAQ in res.locals

    if (templete) {
        res.status(202).json({ templete, success: true, message: 'Templete updated successfully' });
    } else {
        res.status(404);
        throw new Error('Templete not found');
    }
});


const deleteTemplete = catchAsync(async (req, res, next) => {
    const templete = await Permission.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    res.locals.dataId = templete._id; // Store the ID of the created FAQ in res.locals
    if (templete) {
        res.json({ success: true, message: 'Templete removed' });
    } else {
        res.status(404);
        throw new Error('Templete not found');
    }
});




/// //////////////////////////////////task controller///////////////////////////////////////

const createTempleteTask = catchAsync(async (req, res, next) => {
    const { templateName, tasks } = req.body;
    const partialSchema = tasktempleteValidation.fork(["templateName", "tasks"], (schema) => schema.required());
    const { error } = partialSchema.validate(req.body, {
        abortEarly: false
    });

    if (error) {
        const errorFields = joiError(error);
        return next(new AppError('Validation failed', 400, { errorFields }));
    }


    const templete = new Task({
        templateName,
        tasks,
        assignedby: req.user._id
    });
    res.locals.dataId = templete._id; // Store the ID of the created FAQ in res.locals

    const createdTemplete = await templete.save();
    res.status(202).json({ createdTemplete, success: true, message: 'Templete created successfully' });
}); 




const editTaskTemplete = catchAsync(async (req, res, next) => {
    const { error } = tasktempleteValidation.validate(req.body, {
        abortEarly: false,
        allowUnknown: true
    });

    if (error) {
        const errorFields = joiError(error);
        return next(new AppError('Validation failed', 400, { errorFields }));
    }


   
    // Build a dynamic $set object
    const updateFields = {
        ...req.body,
        assignedby: req.user._id
    };
   

    const templete = await Task.findByIdAndUpdate(
        req.params.id,
        updateFields,
        {
            
            new: true,
            runValidators: true
        }
    );
    res.locals.dataId = templete._id; // Store the ID of the created FAQ in res.locals
    if (templete) {
        res.json({ templete, success: true, message: 'Task updated successfully' });
    } else {
        res.status(404);
        throw new Error('Templete not found');
    }
});



const deleteTask = catchAsync(async (req, res, next) => {
    const templete = await Task.findByIdAndUpdate(req.params.id, { isDeleted: true }, { new: true });
    res.locals.dataId = templete._id;

    if (templete) {
        res.json({ success: true, message: 'Templete removed' });
    } else {
        res.status(404);
        throw new Error('Templete not found');
    }
});

const getTaskTempleteById = catchAsync(async (req, res) => {
    const templete = await Task.findById(req.params.id);
    if (templete) {
        res.json(templete);
    } else {
        res.status(404);
        throw new Error('Templete not found');
    }
});
const getTaskTempletes = catchAsync(async (req, res) => {
    const { search } = req.query;
    const isDeleted = normalizeIsDeleted(req.query.isDeleted);
    const searchQuery = search ? { templateName: { $regex: search, $options: 'i' } } : {};
    const query = withSoftDeleteFilter(searchQuery, isDeleted);
    const APIFeature = new APIFeatures(Task.find(query), req.query).paginate();
    const templetes = await APIFeature.query;
    const totalTempletes = await Task.countDocuments(query);

    res.json({
        templetes,
        totalTempletes,
        success: true,
        message: 'Templetes fetched successfully'
    });
});

const getTaskTemplateNames = catchAsync(async (req, res) => {
    const isDeleted = normalizeIsDeleted(req.query.isDeleted);
    const templates = await Task.find(withSoftDeleteFilter({}, isDeleted)).select('templateName assignedby');

    res.status(200).json({
        templates,
        success: true,
        message: 'Templetes fetched successfully'
    });

});



module.exports = {
    getTempletes,
    getTempleteById,
    createTempletePermission,
    updateTemplete,
    deleteTemplete,
    getTempleteNames,

    deleteTask,
    createTempleteTask,
    editTaskTemplete,
    getTaskTempletes,
    getTaskTempleteById,
    getTaskTemplateNames
};



