// Mongoose model for support tickets.
const mongoose = require('mongoose');
const { Priority, TicketStatus } = require('./enums');

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    priority: { type: String, enum: Object.values(Priority), required: true },
    status: { type: String, enum: Object.values(TicketStatus), default: TicketStatus.NEW },
    isOverdue: { type: Boolean, default: false },

    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', required: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedToId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    firstResponseDueAt: { type: Date, default: null },
    resolutionDueAt: { type: Date, default: null },
    escalationDueAt: { type: Date, default: null },
    firstRespondedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
    escalatedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ticketSchema.index({ status: 1 });
ticketSchema.index({ requesterId: 1 });
ticketSchema.index({ assignedToId: 1 });
ticketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
