const mongoose = require('mongoose');

const subDepartmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    description: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

subDepartmentSchema.index({ name: 'text' });
subDepartmentSchema.index({ departmentId: 1 });

module.exports = mongoose.model('SubDepartment', subDepartmentSchema);
