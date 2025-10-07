export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(d);
};

export const getTimeRangeDates = (range: string): { start: Date; end: Date } => {
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

export const formatTimeRange = (range: string): string => {
  const { start, end } = getTimeRangeDates(range);
  return `${formatDate(start)} - ${formatDate(end)}`;
};

export const getWeekLabel = (dateString: string): string => {
  const date = new Date(dateString);
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
};

export const isDateInRange = (date: string | Date, start: Date, end: Date): boolean => {
  const d = new Date(date);
  return d >= start && d <= end;
};
