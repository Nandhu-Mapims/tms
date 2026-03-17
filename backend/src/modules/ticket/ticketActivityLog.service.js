const { prisma } = require('../../config/database');
const parsePositiveInt = require('../../utils/parsePositiveInt');
const { getTicketForAccess } = require('./ticket.shared');

const getActivityLog = async (ticketId, user) => {
  const parsedTicketId = parsePositiveInt(ticketId, 'id');
  const ticket = await getTicketForAccess(parsedTicketId, user);

  return prisma.ticketActivityLog.findMany({
    where: { ticketId: ticket.id },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

module.exports = {
  getActivityLog,
};
