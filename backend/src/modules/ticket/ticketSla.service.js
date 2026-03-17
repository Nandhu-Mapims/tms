const { TicketStatus } = require('@prisma/client');
const { prisma } = require('../../config/database');
const parsePagination = require('../../utils/parsePagination');

const NON_ACTIONABLE_STATUSES = [TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.CANCELLED];

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);

const getActiveSlaConfig = async (priority, tx = prisma) => {
  return tx.sLAConfig.findFirst({
    where: {
      priority,
      isActive: true,
    },
  });
};

const calculateSlaDeadlines = async ({ priority, createdAt = new Date() }, tx = prisma) => {
  const slaConfig = await getActiveSlaConfig(priority, tx);

  if (!slaConfig) {
    return {
      slaConfig: null,
      firstResponseDueAt: null,
      resolutionDueAt: null,
      escalationDueAt: null,
    };
  }

  return {
    slaConfig,
    firstResponseDueAt: addMinutes(createdAt, slaConfig.firstResponseMinutes),
    resolutionDueAt: addMinutes(createdAt, slaConfig.resolutionMinutes),
    escalationDueAt: addMinutes(createdAt, slaConfig.escalationMinutes),
  };
};

const getSlaState = async (ticket, tx = prisma) => {
  const deadlines = await calculateSlaDeadlines({
    priority: ticket.priority,
    createdAt: ticket.createdAt,
  }, tx);

  const now = new Date();
  const resolutionBreached = Boolean(
    deadlines.resolutionDueAt && !ticket.resolvedAt && now > deadlines.resolutionDueAt
  );
  const firstResponseBreached = Boolean(
    deadlines.firstResponseDueAt && !ticket.firstRespondedAt && now > deadlines.firstResponseDueAt
  );
  const escalationThresholdReached = Boolean(
    deadlines.escalationDueAt && !ticket.escalatedAt && !NON_ACTIONABLE_STATUSES.includes(ticket.status) && now > deadlines.escalationDueAt
  );

  return {
    ...deadlines,
    firstResponseBreached,
    resolutionBreached,
    escalationThresholdReached,
    isOverdue: resolutionBreached,
  };
};

const markOverdueTickets = async (tx = prisma) => {
  const tickets = await tx.ticket.findMany({
    where: {
      status: {
        notIn: NON_ACTIONABLE_STATUSES,
      },
    },
    select: {
      id: true,
      priority: true,
      createdAt: true,
      resolvedAt: true,
      firstRespondedAt: true,
      escalatedAt: true,
      status: true,
      isOverdue: true,
    },
  });

  const overdueIds = [];
  const clearedIds = [];

  for (const ticket of tickets) {
    const slaState = await getSlaState(ticket, tx);

    if (slaState.isOverdue && !ticket.isOverdue) {
      overdueIds.push(ticket.id);
    }

    if (!slaState.isOverdue && ticket.isOverdue) {
      clearedIds.push(ticket.id);
    }
  }

  if (overdueIds.length) {
    await tx.ticket.updateMany({
      where: { id: { in: overdueIds } },
      data: { isOverdue: true },
    });
  }

  if (clearedIds.length) {
    await tx.ticket.updateMany({
      where: { id: { in: clearedIds } },
      data: { isOverdue: false },
    });
  }

  return {
    markedOverdueCount: overdueIds.length,
    clearedOverdueCount: clearedIds.length,
  };
};

const getPendingEscalations = async (query = {}, tx = prisma) => {
  const pagination = parsePagination(query);

  const tickets = await tx.ticket.findMany({
    where: {
      status: {
        notIn: [...NON_ACTIONABLE_STATUSES, TicketStatus.ESCALATED],
      },
    },
    include: {
      department: { select: { id: true, name: true, code: true } },
      category: { select: { id: true, name: true, code: true } },
      requester: { select: { id: true, fullName: true, email: true, role: true } },
      assignedTo: { select: { id: true, fullName: true, email: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const candidates = [];

  for (const ticket of tickets) {
    const slaState = await getSlaState(ticket, tx);

    if (slaState.isOverdue || slaState.escalationThresholdReached) {
      candidates.push({
        ...ticket,
        sla: {
          firstResponseDueAt: slaState.firstResponseDueAt,
          resolutionDueAt: slaState.resolutionDueAt,
          escalationDueAt: slaState.escalationDueAt,
          firstResponseBreached: slaState.firstResponseBreached,
          resolutionBreached: slaState.resolutionBreached,
          escalationThresholdReached: slaState.escalationThresholdReached,
          isOverdue: slaState.isOverdue,
        },
      });
    }
  }

  const pagedItems = candidates.slice(pagination.skip, pagination.skip + pagination.limit);

  return {
    items: pagedItems,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total: candidates.length,
      totalPages: Math.ceil(candidates.length / pagination.limit) || 1,
    },
  };
};

const runSlaAudit = async (tx = prisma) => {
  const overdueSummary = await markOverdueTickets(tx);
  const pendingEscalations = await getPendingEscalations({ page: 1, limit: 100 }, tx);

  return {
    ...overdueSummary,
    pendingEscalationCount: pendingEscalations.meta.total,
  };
};

module.exports = {
  calculateSlaDeadlines,
  getSlaState,
  markOverdueTickets,
  getPendingEscalations,
  runSlaAudit,
};
