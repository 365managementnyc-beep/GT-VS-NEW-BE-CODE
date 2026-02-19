const mongoose=require("mongoose")
const { Schema, model } = require('mongoose');

const DisputeSchema = new Schema({
  property: {
    type: Schema.Types.ObjectId,
    ref:"Booking",
    required: true
  },
  disputeBy:{
    type: Schema.Types.ObjectId,
    ref:"User",
    required: true
  },
  disputeRole:{
    type:String,
    trim:true,
    enum:["customer","vendor"]
  },
  description: {
    type: String,
    trim: true
  },
  status:{
    type:String,
    enum:["Pending","Review","Reject","Accept"],
    default:"Pending"
  },
  isDeleted: {
    type: Boolean,
    default: false // Soft delete
  }
},{toJSON: {getters: true}});
const AutoIncrement = require('mongoose-sequence')(mongoose);

DisputeSchema.plugin(AutoIncrement, { inc_field: 'propertyID', start_seq: 1 });
module.exports = model('Dispute', DisputeSchema);

