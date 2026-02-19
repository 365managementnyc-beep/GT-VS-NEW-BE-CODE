const { Schema, model } = require('mongoose');

const TaxSchema = new Schema(
    {
        vendorId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        businessName: {
            type: String,
            required: true,
            trim: true
        },
        taxClassification: {
            type: String,
            trim: true,
            required: true
        },
        taxId: {
            type: String
            
        },
        deliveryForm: {
            type: String,
            required: true,
            enum: ['email',"electronic"],
            trim: true
        },
        taxDocument: {
           type: String
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected',"inprogress"],
            default: 'pending'
        },
        isDeleted: {
            type: Boolean,
            default: false // Soft delete
        }
    },
    { timestamps: true }
);

module.exports = model('TaxForum', TaxSchema);
