// Mongoose model for audit trail of ticket state changes.
const mongoose = require('mongoose');

const ticketActivityLogSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true },
    fromValue: { type: String, default: null },
    toValue: { type: String, default: null },
    note: { type: String, default: null },
  },
  { timestamps: true }
);

ticketActivityLogSchema.index({ ticketId: 1, createdAt: -1 });

module.exports = mongoose.model('TicketActivityLog', ticketActivityLogSchema);
