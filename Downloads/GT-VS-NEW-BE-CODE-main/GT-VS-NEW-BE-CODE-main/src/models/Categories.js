const { Schema, model } = require('mongoose');

const categoriesSchema = Schema(
  {
    name: { type: String, required: true, unique: true, index: true }
  },
  {
    timestamps: true,
    versionKey: false
  }
);
module.exports = model('Categories', categoriesSchema);

