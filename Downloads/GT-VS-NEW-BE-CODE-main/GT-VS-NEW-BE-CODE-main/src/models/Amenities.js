// Category Model
const { Schema, model } = require('mongoose');

const categorySchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
});

const Category = model('Category', categorySchema);

// Amenities Model (Updated)
const amenitiesSchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],  // References to Category
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
});

const Amenities = model('Amenities', amenitiesSchema);

module.exports = {
    Category,
    Amenities
};

