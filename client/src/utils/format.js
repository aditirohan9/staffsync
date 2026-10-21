export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const fmtTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';

export const dayCount = (start, end) => Math.round((new Date(end) - new Date(start)) / 86400000) + 1;

export const workedHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return '—';
  const mins = Math.max(Math.round((new Date(checkOut) - new Date(checkIn)) / 60000), 0);
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export const errMsg = (e) => e.response?.data?.message || e.message || 'Something went wrong';
