// Mongoose model for files attached to tickets.
const mongoose = require('mongoose');

const ticketAttachmentSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true },
    uploadedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, default: null },
    sizeBytes: { type: Number, default: null },
  },
  { timestamps: true }
);

ticketAttachmentSchema.index({ ticketId: 1 });

module.exports = mongoose.model('TicketAttachment', ticketAttachmentSchema);
