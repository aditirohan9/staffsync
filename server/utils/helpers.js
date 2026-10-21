const User = require('../models/User');

// ?page=1&limit=10  (limit capped at 100)
const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const paginated = (data, total, page, limit) => ({
  data,
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

// Returns ids of everyone who reports to this manager
const getTeamIds = async (managerId) => {
  const team = await User.find({ managerId }).select('_id');
  return team.map((u) => u._id);
};

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { parsePagination, paginated, getTeamIds, startOfDay, endOfDay, isValidDate, escapeRegex };
