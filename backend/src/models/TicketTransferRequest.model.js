// Mongoose model for agent-to-agent ticket transfer requests.
const mongoose = require('mongoose');
const { TransferRequestStatus } = require('./enums');

const ticketTransferRequestSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    ticketNumber: { type: String, required: true },
    ticketTitle: { type: String, required: true },

    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: {
      type: String,
      enum: Object.values(TransferRequestStatus),
      default: TransferRequestStatus.PENDING,
      required: true,
      index: true,
    },

    requestedNote: { type: String, default: null },
    decidedNote: { type: String, default: null },
    decidedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ticketTransferRequestSchema.index({ requesterId: 1, status: 1, createdAt: -1 });
ticketTransferRequestSchema.index({ targetAgentId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('TicketTransferRequest', ticketTransferRequestSchema);

