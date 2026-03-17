const formatRunningNumber = (value) => String(value).padStart(6, '0');

const buildTicketNumber = ({ categoryCode, year, runningNumber }) => {
  return `TKT-${categoryCode}-${year}-${formatRunningNumber(runningNumber)}`;
};

module.exports = {
  buildTicketNumber,
  formatRunningNumber,
};
