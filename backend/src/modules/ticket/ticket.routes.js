const express = require('express');
const ticketController = require('./ticket.controller');
const ticketCommentController = require('./ticketComment.controller');
const ticketAttachmentController = require('./ticketAttachment.controller');
const ticketActivityLogController = require('./ticketActivityLog.controller');
const ticketTransferRequestController = require('./ticketTransferRequest.controller');
const ticketAssignmentNoticeController = require('./ticketAssignmentNotice.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { uploadTicketAttachment } = require('../../middlewares/upload.middleware');

const router = express.Router();

router.use(protect);

router.get('/escalations/pending', ticketController.getPendingEscalations);
router.get('/assignment-notices', ticketAssignmentNoticeController.getAssignmentNotices);
router.get('/transfer-requests/sent', ticketTransferRequestController.getSentTransferRequests);
router.get('/transfer-requests/received', ticketTransferRequestController.getReceivedTransferRequests);
router.post('/:id/transfer-requests', ticketTransferRequestController.createTransferRequest);
router.patch('/transfer-requests/:requestId/approve', ticketTransferRequestController.approveTransferRequest);
router.patch('/transfer-requests/:requestId/reject', ticketTransferRequestController.rejectTransferRequest);
router.route('/').post(ticketController.createTicket).get(ticketController.getTickets);
router.route('/:id').get(ticketController.getTicketById).patch(ticketController.updateTicket);
router.patch('/:id/claim', ticketController.claimTicket);
router.patch('/:id/transfer', ticketController.transferTicket);
router.patch('/:id/status', ticketController.updateStatus);
router.patch('/:id/resolve', ticketController.resolveTicket);
router.patch('/:id/confirm-resolution', ticketController.confirmResolutionAndClose);
router.patch('/:id/close', ticketController.closeTicket);
router.patch('/:id/reopen', ticketController.reopenTicket);
router.patch('/:id/escalate', ticketController.escalateTicket);
router.route('/:id/comments').post(ticketCommentController.addComment).get(ticketCommentController.getComments);
router.route('/:id/attachments').post(uploadTicketAttachment, ticketAttachmentController.addAttachment).get(ticketAttachmentController.getAttachments);
router.get('/:id/activity-log', ticketActivityLogController.getActivityLog);

module.exports = router;
