// Mongoose model for hospital staff and requester accounts.
const mongoose = require('mongoose');
const { Role } = require('./enums');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    empId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      match: [/^\d{5}$/, 'Employee ID must be exactly 5 digits'],
    },
    email: { type: String, default: null, lowercase: true, trim: true, sparse: true, unique: true },
    phone: { type: String, default: null },
    password: { type: String, required: true },
    role: { type: String, enum: Object.values(Role), required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);


module.exports = mongoose.model('User', userSchema);
