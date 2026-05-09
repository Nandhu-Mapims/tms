const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../utils/ApiError');
const { Priority, TicketStatus, Role } = require('../../models/enums');
const { createActivityLog } = require('../ticket/ticketActivity.service');

const Department = require('../../models/Department.model');
const Category = require('../../models/Category.model');
const Subcategory = require('../../models/Subcategory.model');
const User = require('../../models/User.model');
const Ticket = require('../../models/Ticket.model');

const FEEDBACK_SECTION_NAME = 'Feedback Tickets';
const FEEDBACK_DEPARTMENT_CODE = 'FBK';
const FEEDBACK_CATEGORY_CODE = 'FBK';

const normalizeLookup = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function pickHandlingDepartment(tmsDepartments, feedbackDepartmentName) {
  const list = Array.isArray(tmsDepartments) ? tmsDepartments : [];
  const desired = normalizeLookup(feedbackDepartmentName);
  if (!desired) return null;

  const exact = list.find((d) => normalizeLookup(d?.name) === desired);
  if (exact) return exact;

  const fuzzy = list.find((d) => {
    const name = normalizeLookup(d?.name);
    return name && (name.includes(desired) || desired.includes(name));
  });
  return fuzzy || null;
}

function normalizeCodeToken(value, fallback = 'GEN') {
  const token = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 12);
  return token || fallback;
}

function shortStableSuffix(input) {
  const str = String(input || '');
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 4) || 'X1';
}

const buildTicketNumber = ({ categoryCode, year, runningNumber }) =>
  `TKT-${categoryCode}-${year}-${String(runningNumber).padStart(4, '0')}`;

async function generateTicketNumber(categoryCode) {
  const year = new Date().getUTCFullYear();
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  const count = await Ticket.countDocuments({ createdAt: { $gte: start, $lt: end } });
  return buildTicketNumber({ categoryCode, year, runningNumber: count + 1 });
}

function mapPriorityFromFeedback(fb) {
  const urgency = String(fb?.aiUrgency || '').toLowerCase();
  if (urgency === 'high') return Priority.CRITICAL;
  if (urgency === 'medium') return Priority.HIGH;
  if (urgency === 'low') return Priority.MEDIUM;

  const rating = Number(fb?.rating);
  if (rating <= 1) return Priority.CRITICAL;
  if (rating <= 2) return Priority.HIGH;
  if (rating <= 3) return Priority.MEDIUM;
  return Priority.LOW;
}

function summarizeForTms(feedback) {
  const patient = feedback?.patientName || 'Patient';
  const dept = feedback?.department || 'Unknown department';
  const rating = feedback?.rating;
  const comments = String(feedback?.comments || '').trim();
  const aiSummary = String(feedback?.aiSummary || '').trim();
  const aiSentiment = feedback?.aiSentiment ? ` | AI sentiment: ${feedback.aiSentiment}` : '';
  const aiUrgency = feedback?.aiUrgency ? ` | urgency: ${feedback.aiUrgency}` : '';

  const titleBase = comments || aiSummary || `Negative feedback from ${patient} for ${dept}`;
  const title = `[Patient Feedback] ${titleBase}`.replace(/\s+/g, ' ').slice(0, 120);

  const lines = [
    `Patient: ${patient}`,
    `Department (as captured by feedback): ${dept}`,
    rating != null ? `Rating: ${rating}/5` : null,
    aiSentiment.trim() || null,
    aiUrgency.trim() || null,
    '',
    'Verbatim comments:',
    comments || '(no text comments)',
    aiSummary ? `\nAI summary:\n${aiSummary}` : null,
  ].filter((line) => line !== null);

  return { title, prompt: lines.join('\n') };
}

async function ensureFeedbackSectionDocs() {
  let fbDept = await Department.findOne({
    $or: [{ code: FEEDBACK_DEPARTMENT_CODE }, { name: FEEDBACK_SECTION_NAME }],
  }).lean();
  if (!fbDept) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Feedback Tickets department is missing — run server bootstrap');
  }

  let category = await Category.findOne({
    $or: [{ code: FEEDBACK_CATEGORY_CODE }, { name: FEEDBACK_SECTION_NAME }],
  }).lean();
  if (!category) {
    throw new ApiError(StatusCodes.SERVICE_UNAVAILABLE, 'Feedback Tickets category is missing — run server bootstrap');
  }

  return { fbDept, category };
}

async function ensureDepartmentSubcategory(categoryId, feedbackDepartmentName) {
  const departmentName = String(feedbackDepartmentName || 'General Feedback').trim() || 'General Feedback';
  let subcategory = await Subcategory.findOne({
    categoryId,
    name: departmentName,
  });

  if (!subcategory) {
    const base = `FB_${normalizeCodeToken(departmentName, 'GENERAL')}`;
    let code = base;
    const conflict = await Subcategory.findOne({ code });
    if (conflict) {
      code = `${base}_${shortStableSuffix(departmentName)}`.slice(0, 20);
    }
    subcategory = await Subcategory.create({
      name: departmentName,
      code,
      description: 'Auto-created from Feedback System integration',
      isActive: true,
      categoryId,
    });
  } else if (!subcategory.isActive) {
    subcategory.isActive = true;
    await subcategory.save();
  }

  return subcategory;
}

async function resolveRequesterUserId() {
  const configured = String(process.env.FEEDBACK_INGEST_REQUESTER_USER_ID || '').trim();
  if (configured && mongoose.Types.ObjectId.isValid(configured)) {
    const user = await User.findOne({ _id: configured, isActive: true }).select('_id').lean();
    if (user?._id) return user._id;
  }

  const fallback =
    (await User.findOne({ role: Role.REQUESTER, isActive: true }).sort({ createdAt: 1 }).select('_id').lean()) ||
    (await User.findOne({ isActive: true }).sort({ createdAt: 1 }).select('_id').lean());

  if (!fallback?._id) {
    throw new ApiError(
      StatusCodes.SERVICE_UNAVAILABLE,
      'No TMS user available for feedback ingest — set FEEDBACK_INGEST_REQUESTER_USER_ID or seed a REQUESTER user'
    );
  }
  return fallback._id;
}

const listDepartmentsForIngest = async () => {
  const data = await Department.find({ isActive: true }).sort({ name: 1 }).lean();
  return { data, meta: { count: data.length } };
};

/**
 * @param {object} feedback — Feedback System document fields (plain JSON from HTTP)
 */
const createTicketFromFeedback = async (feedback) => {
  if (!feedback || typeof feedback !== 'object') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'feedback object is required');
  }

  const { fbDept, category } = await ensureFeedbackSectionDocs();
  const subcategory = await ensureDepartmentSubcategory(category._id, feedback.department);

  const activeDepartments = await Department.find({ isActive: true }).lean();
  const aiMatched = pickHandlingDepartment(activeDepartments, feedback.department);
  const handlingDepartment = aiMatched || fbDept;

  if (!handlingDepartment?._id) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Could not resolve handling department');
  }

  const { title, prompt } = summarizeForTms(feedback);
  const priority = mapPriorityFromFeedback(feedback);
  const ticketNumber = await generateTicketNumber(String(category.code || 'GEN').toUpperCase());
  const requesterId = await resolveRequesterUserId();

  const voiceRel = feedback.voiceRecordingRelPath
    ? String(feedback.voiceRecordingRelPath).replace(/^\/+/, '')
    : null;
  const sourceId = feedback._id != null ? String(feedback._id) : null;

  const ticket = await Ticket.create({
    ticketNumber,
    title: String(title || '').slice(0, 120),
    description: String(prompt || ''),
    priority,
    status: TicketStatus.OPEN,
    isOverdue: false,
    departmentId: handlingDepartment._id,
    requesterDepartmentId: null,
    categoryId: category._id,
    subcategoryId: subcategory._id,
    locationId: null,
    locationText: null,
    requesterId,
    assignedToId: null,
    telecomNumber: null,
    feedbackSourceId: sourceId || null,
    feedbackVoiceRecordingRelPath: voiceRel || null,
  });

  await createActivityLog(null, {
    ticketId: ticket._id,
    userId: requesterId,
    action: 'CREATED',
    remarks: 'Ticket created from Feedback System (HTTP integration)',
  });

  const id = ticket._id.toString();
  return {
    id,
    _id: ticket._id,
    ticketNumber: ticket.ticketNumber,
    status: ticket.status,
    departmentId: handlingDepartment._id.toString(),
  };
};

const patchVoiceMeta = async (ticketId, { feedbackVoiceRecordingRelPath, feedbackSourceId } = {}) => {
  const normalized = String(ticketId || '').trim();
  if (!normalized || !mongoose.Types.ObjectId.isValid(normalized)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid ticket id');
  }

  const set = { updatedAt: new Date() };
  let has = false;
  if (feedbackVoiceRecordingRelPath != null && String(feedbackVoiceRecordingRelPath).trim()) {
    set.feedbackVoiceRecordingRelPath = String(feedbackVoiceRecordingRelPath).replace(/^\/+/, '');
    has = true;
  }
  if (feedbackSourceId != null && String(feedbackSourceId).trim()) {
    set.feedbackSourceId = String(feedbackSourceId).trim();
    has = true;
  }
  if (!has) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Nothing to update');
  }

  const updated = await Ticket.findByIdAndUpdate(normalized, { $set: set }, { new: true }).lean();
  if (!updated) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Ticket not found');
  }

  return { ok: true };
};

module.exports = {
  listDepartmentsForIngest,
  createTicketFromFeedback,
  patchVoiceMeta,
};
