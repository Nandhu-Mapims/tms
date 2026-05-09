const { StatusCodes } = require('http-status-codes');
const asyncHandler = require('../../utils/asyncHandler');
const sendResponse = require('../../utils/sendResponse');
const feedbackIntegrationService = require('./feedbackIntegration.service');

const health = asyncHandler(async (_req, res) =>
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Feedback integration ingress is available',
    data: { ok: true, mode: 'http' },
  })
);

const listDepartments = asyncHandler(async (_req, res) => {
  const result = await feedbackIntegrationService.listDepartmentsForIngest();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Departments fetched',
    data: result.data,
    meta: result.meta,
  });
});

const createTicket = asyncHandler(async (req, res) => {
  const feedback = req.body?.feedback ?? req.body;
  const data = await feedbackIntegrationService.createTicketFromFeedback(feedback);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    message: 'Feedback ticket created in TMS',
    data,
  });
});

const patchVoiceMeta = asyncHandler(async (req, res) => {
  await feedbackIntegrationService.patchVoiceMeta(req.params.id, req.body || {});
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    message: 'Voice metadata updated',
    data: { ok: true },
  });
});

module.exports = {
  health,
  listDepartments,
  createTicket,
  patchVoiceMeta,
};
