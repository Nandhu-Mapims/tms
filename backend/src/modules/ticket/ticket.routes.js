const express = require('express');
const ticketController = require('./ticket.controller');
const ticketCommentController = require('./ticketComment.controller');
const ticketAttachmentController = require('./ticketAttachment.controller');
const ticketActivityLogController = require('./ticketActivityLog.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { uploadTicketAttachment } = require('../../middlewares/upload.middleware');

const router = express.Router();

router.use(protect);

router.get('/escalations/pending', ticketController.getPendingEscalations);
router.route('/').post(ticketController.createTicket).get(ticketController.getTickets);
router.route('/:id').get(ticketController.getTicketById).patch(ticketController.updateTicket);
router.patch('/:id/assign', ticketController.assignTicket);
router.patch('/:id/status', ticketController.updateStatus);
router.patch('/:id/resolve', ticketController.resolveTicket);
router.patch('/:id/close', ticketController.closeTicket);
router.patch('/:id/reopen', ticketController.reopenTicket);
router.patch('/:id/escalate', ticketController.escalateTicket);
router.route('/:id/comments').post(ticketCommentController.addComment).get(ticketCommentController.getComments);
router.route('/:id/attachments').post(uploadTicketAttachment, ticketAttachmentController.addAttachment).get(ticketAttachmentController.getAttachments);
router.get('/:id/activity-log', ticketActivityLogController.getActivityLog);

module.exports = router;
