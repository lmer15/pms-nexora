const getTimeRangeDates = (range) => {
  const end = new Date();
  const start = new Date();

  switch (range) {
    case '1w':
      start.setDate(end.getDate() - 7);
      break;
    case '2w':
      start.setDate(end.getDate() - 14);
      break;
    case '4w':
      start.setDate(end.getDate() - 28);
      break;
    case '8w':
      start.setDate(end.getDate() - 56);
      break;
    case '12w':
      start.setDate(end.getDate() - 84);
      break;
    default:
      start.setDate(end.getDate() - 28);
  }

  return { start, end };
};

const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDateTime = (date) => {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatTimeRange = (range) => {
  const { start, end } = getTimeRangeDates(range);
  return `${formatDate(start)} - ${formatDate(end)}`;
};

module.exports = {
  getTimeRangeDates,
  formatDate,
  formatDateTime,
  formatTimeRange
};
