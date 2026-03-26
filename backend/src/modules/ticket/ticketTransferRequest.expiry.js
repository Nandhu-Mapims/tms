// Expires pending ticket transfer requests after a fixed TTL (no cron required; runs on read/write).
const TicketTransferRequest = require('../../models/TicketTransferRequest.model');
const { TransferRequestStatus } = require('../../models/enums');

const TRANSFER_REQUEST_PENDING_TTL_MS = 3 * 24 * 60 * 60 * 1000;

const expireStalePendingTransferRequests = async () => {
  const cutoff = new Date(Date.now() - TRANSFER_REQUEST_PENDING_TTL_MS);
  await TicketTransferRequest.updateMany(
    { status: TransferRequestStatus.PENDING, createdAt: { $lt: cutoff } },
    {
      $set: {
        status: TransferRequestStatus.CANCELLED,
        decidedAt: new Date(),
        decidedNote: 'Automatically revoked after 3 days with no approval.',
        decidedById: null,
      },
    },
  );
};

module.exports = {
  expireStalePendingTransferRequests,
  TRANSFER_REQUEST_PENDING_TTL_MS,
};
