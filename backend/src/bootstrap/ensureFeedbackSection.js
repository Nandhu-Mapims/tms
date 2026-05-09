const Department = require('../models/Department.model');
const Category = require('../models/Category.model');
const Subcategory = require('../models/Subcategory.model');

const FEEDBACK_DEPARTMENT_NAME = 'Feedback Tickets';
const FEEDBACK_DEPARTMENT_CODE = 'FBK';
const FEEDBACK_CATEGORY_NAME = 'Feedback Tickets';
const FEEDBACK_CATEGORY_CODE = 'FBK';
const FEEDBACK_SUBCATEGORY_NAME = 'General Feedback';
const FEEDBACK_SUBCATEGORY_CODE = 'FBK-GEN';

async function ensureFeedbackSection() {
  const now = new Date();

  let department = await Department.findOne({
    $or: [{ code: FEEDBACK_DEPARTMENT_CODE }, { name: FEEDBACK_DEPARTMENT_NAME }],
  });
  if (!department) {
    department = await Department.create({
      name: FEEDBACK_DEPARTMENT_NAME,
      code: FEEDBACK_DEPARTMENT_CODE,
      description: 'Auto-created section for feedback-system tickets',
      isActive: true,
    });
  } else if (!department.isActive) {
    department.isActive = true;
    department.description = department.description || 'Auto-created section for feedback-system tickets';
    department.updatedAt = now;
    await department.save();
  }

  let category = await Category.findOne({
    $or: [{ code: FEEDBACK_CATEGORY_CODE }, { name: FEEDBACK_CATEGORY_NAME }],
  });
  if (!category) {
    category = await Category.create({
      name: FEEDBACK_CATEGORY_NAME,
      code: FEEDBACK_CATEGORY_CODE,
      description: 'Auto-created category for feedback-system tickets',
      departmentId: department._id,
      isActive: true,
    });
  } else {
    let changed = false;
    if (!category.isActive) {
      category.isActive = true;
      changed = true;
    }
    if (String(category.departmentId || '') !== String(department._id)) {
      category.departmentId = department._id;
      changed = true;
    }
    if (changed) {
      category.updatedAt = now;
      await category.save();
    }
  }

  let subcategory = await Subcategory.findOne({
    $or: [{ code: FEEDBACK_SUBCATEGORY_CODE }, { name: FEEDBACK_SUBCATEGORY_NAME, categoryId: category._id }],
  });
  if (!subcategory) {
    await Subcategory.create({
      name: FEEDBACK_SUBCATEGORY_NAME,
      code: FEEDBACK_SUBCATEGORY_CODE,
      description: 'Default feedback subcategory (auto-created)',
      categoryId: category._id,
      isActive: true,
    });
  } else {
    let changed = false;
    if (!subcategory.isActive) {
      subcategory.isActive = true;
      changed = true;
    }
    if (String(subcategory.categoryId || '') !== String(category._id)) {
      subcategory.categoryId = category._id;
      changed = true;
    }
    if (changed) {
      subcategory.updatedAt = now;
      await subcategory.save();
    }
  }
}

module.exports = { ensureFeedbackSection };
