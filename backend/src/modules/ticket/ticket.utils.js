const { StatusCodes } = require('http-status-codes');
const ApiError = require('../../utils/ApiError');
const { buildTicketNumber } = require('../../utils/ticketNumberGenerator');

const TICKET_INCLUDE = {
  department: {
    select: { id: true, name: true, code: true },
  },
  category: {
    select: { id: true, name: true, code: true },
  },
  subcategory: {
    select: { id: true, name: true, code: true, categoryId: true },
  },
  location: true,
  requester: {
    select: { id: true, fullName: true, email: true, phone: true, role: true },
  },
  assignedTo: {
    select: { id: true, fullName: true, email: true, phone: true, role: true },
  },
};

const buildDateRangeFilter = (startDate, endDate) => {
  if (!startDate && !endDate) {
    return undefined;
  }

  const createdAt = {};

  if (startDate) {
    const parsedStart = new Date(startDate);
    if (Number.isNaN(parsedStart.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid startDate supplied');
    }
    createdAt.gte = parsedStart;
  }

  if (endDate) {
    const parsedEnd = new Date(endDate);
    if (Number.isNaN(parsedEnd.getTime())) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid endDate supplied');
    }
    parsedEnd.setHours(23, 59, 59, 999);
    createdAt.lte = parsedEnd;
  }

  return createdAt;
};

const buildTicketSearchFilter = (search) => {
  if (!search || !search.trim()) {
    return undefined;
  }

  const term = search.trim();

  return {
    OR: [
      {
        ticketNumber: {
          contains: term,
        },
      },
      {
        title: {
          contains: term,
        },
      },
    ],
  };
};

const getYearRange = (year) => {
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);

  return { start, end };
};

const generateTicketNumber = async (tx, categoryCode) => {
  const year = new Date().getUTCFullYear();
  const { start, end } = getYearRange(year);

  const count = await tx.ticket.count({
    where: {
      category: { code: categoryCode },
      createdAt: {
        gte: start,
        lt: end,
      },
    },
  });

  return buildTicketNumber({
    categoryCode,
    year,
    runningNumber: count + 1,
  });
};

module.exports = {
  TICKET_INCLUDE,
  buildDateRangeFilter,
  buildTicketSearchFilter,
  generateTicketNumber,
};
