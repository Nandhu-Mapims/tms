// Mongoose model for hospital physical locations.
const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    block: { type: String, required: true, trim: true },
    floor: { type: String, default: null },
    ward: { type: String, default: null },
    room: { type: String, default: null },
    unit: { type: String, default: null },
    description: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Location', locationSchema);
