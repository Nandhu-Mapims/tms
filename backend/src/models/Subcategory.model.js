// Mongoose model for ticket subcategories (belongs to a category).
const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    description: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  },
  { timestamps: true }
);

subcategorySchema.index({ name: 'text' });

module.exports = mongoose.model('Subcategory', subcategorySchema);
