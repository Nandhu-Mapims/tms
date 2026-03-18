// Mongoose model for SLA configuration per priority level.
const mongoose = require('mongoose');
const { Priority } = require('./enums');

const slaConfigSchema = new mongoose.Schema(
  {
    priority: {
      type: String,
      enum: Object.values(Priority),
      required: true,
      unique: true,
    },
    firstResponseMinutes: { type: Number, required: true, min: 1 },
    resolutionMinutes: { type: Number, required: true, min: 1 },
    escalationMinutes: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SLAConfig', slaConfigSchema);
