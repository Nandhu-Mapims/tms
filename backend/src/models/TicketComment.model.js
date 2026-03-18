// Mongoose model for ticket comments (public and internal).
const mongoose = require('mongoose');

const ticketCommentSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    isInternal: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ticketCommentSchema.index({ ticketId: 1, createdAt: -1 });

module.exports = mongoose.model('TicketComment', ticketCommentSchema);
