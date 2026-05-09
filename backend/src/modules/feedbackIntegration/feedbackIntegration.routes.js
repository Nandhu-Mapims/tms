const express = require('express');
const feedbackIntegrationController = require('./feedbackIntegration.controller');
const { feedbackIngestAuth } = require('../../middlewares/feedbackIngestAuth.middleware');

const router = express.Router();

router.use(feedbackIngestAuth);

router.get('/health', feedbackIntegrationController.health);
router.get('/departments', feedbackIntegrationController.listDepartments);
router.post('/tickets', feedbackIntegrationController.createTicket);
router.patch('/tickets/:id/voice-meta', feedbackIntegrationController.patchVoiceMeta);

module.exports = router;
