

const Filter=require("../models/CreateFilters")
const AppError = require('../utils/appError');
const catchAsync=require("../utils/catchAsync")
const filterSchema=require("../utils/joi/filterValidation")
const joiError=require("./../utils/joiError")
const { normalizeIsDeleted, withSoftDeleteFilter } = require('../utils/softDeleteFilter');


const createFilter=catchAsync(async(req,res,next)=>{
    const {error}=filterSchema.validate(req.body,{abortEarly: false,allowUnknown:true})

    if(error){
        const errorFields=joiError(error)
        return next(new AppError("Valiadation failed",400,{errorFields}))
    }
    const newFilter=await Filter.create(req.body)
    res.locals.dataId=newFilter?._id
    return res.status(200).json({
        status:"success",
        data:newFilter
    })
})

const getAllfilterbyID=catchAsync(async(req,res)=>{
    const {id}=req.params;
    const isDeleted = normalizeIsDeleted(req.query.isDeleted);
    const filters=await Filter.find(withSoftDeleteFilter({ serviceCategory:id }, isDeleted))
    res.status(200).json({
        status:"success",
        results:filters.length,
        data:filters
    })
})

const deleteFilter=catchAsync(async(req,res)=>{
    const {id}=req.params;
    const filter=await Filter.findByIdAndDelete(id)
    res.locals.dataId=filter?._id
    res.status(200).json({
        status:"success",
        data:filter
    })
})
const updatedFilter=catchAsync(async(req,res,next)=>{
    const {id}=req.params;
    const {error}=filterSchema.validate(req.body,{abortEarly: false,allowUnknown:true})

    if(error){
        const errorFields=joiError(error)
        return next(new AppError("Validation failed",400,{errorFields}))
    }

    const filter=await Filter.findByIdAndUpdate(id,req.body,{new:true})
    if(!filter){
        return next(new AppError("Filter not found",404))
    }

    res.locals.dataId=filter?._id
    return res.status(200).json({
        status:"success",
        data:filter
    })
})

module.exports={
    createFilter,
    getAllfilterbyID,
    deleteFilter,
    updatedFilter
}