const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const { parsePagination, paginated, getTeamIds, startOfDay, endOfDay, isValidDate } = require('../utils/helpers');

// "HH:MM" after which check-in is marked Late (server local time)
const LATE_AFTER = process.env.LATE_AFTER || '09:30';

// POST /api/attendance/mark
// 1st call today = check-in, 2nd call = check-out, 3rd call = rejected
exports.markAttendance = async (req, res) => {
  try {
    const now = new Date();
    const today = startOfDay(now);

    const existing = await Attendance.findOne({ userId: req.user._id, date: today });

    if (!existing) {
      const [h, m] = LATE_AFTER.split(':').map(Number);
      const lateLimit = new Date(now);
      lateLimit.setHours(h, m, 0, 0);

      const record = await Attendance.create({
        userId: req.user._id,
        date: today,
        checkIn: now,
        status: now > lateLimit ? 'Late' : 'Present',
      });
      return res.status(201).json({ message: 'Check-in recorded.', attendance: record });
    }

    if (!existing.checkOut) {
      existing.checkOut = now;
      await existing.save();
      return res.json({ message: 'Check-out recorded.', attendance: existing });
    }

    return res.status(400).json({ message: 'Attendance already marked for today.', attendance: existing });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Attendance already marked for today.' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Builds a date filter from ?date=YYYY-MM-DD or ?from=&to=
const buildDateFilter = (query) => {
  if (query.date) {
    const d = new Date(query.date);
    if (!isValidDate(d)) return { error: 'Invalid date.' };
    return { value: { $gte: startOfDay(d), $lte: endOfDay(d) } };
  }
  const range = {};
  if (query.from) {
    const f = new Date(query.from);
    if (!isValidDate(f)) return { error: 'Invalid from date.' };
    range.$gte = startOfDay(f);
  }
  if (query.to) {
    const t = new Date(query.to);
    if (!isValidDate(t)) return { error: 'Invalid to date.' };
    range.$lte = endOfDay(t);
  }
  return { value: Object.keys(range).length ? range : null };
};

// GET /api/attendance/my?from=&to=&status=&page=&limit=
exports.getMyAttendance = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { userId: req.user._id };

    const df = buildDateFilter(req.query);
    if (df.error) return res.status(400).json({ message: df.error });
    if (df.value) filter.date = df.value;
    if (req.query.status) filter.status = req.query.status;

    const [records, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1 }).skip(skip).limit(limit),
      Attendance.countDocuments(filter),
    ]);
    res.json(paginated(records, total, page, limit));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/attendance/all?date=&from=&to=&userId=&status=&page=&limit=
// HR -> all employees, Manager -> only their team
exports.getAllAttendance = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {};

    if (req.user.role === 'manager') {
      const teamIds = await getTeamIds(req.user._id);
      filter.userId = { $in: teamIds };
    }

    if (req.query.userId) {
      if (!mongoose.isValidObjectId(req.query.userId)) return res.status(400).json({ message: 'Invalid userId.' });
      if (req.user.role === 'manager') {
        const inTeam = filter.userId.$in.some((id) => id.toString() === req.query.userId);
        if (!inTeam) return res.status(403).json({ message: 'That user is not in your team.' });
      }
      filter.userId = req.query.userId;
    }

    const df = buildDateFilter(req.query);
    if (df.error) return res.status(400).json({ message: df.error });
    if (df.value) filter.date = df.value;
    if (req.query.status) filter.status = req.query.status;

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('userId', 'name email department designation')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Attendance.countDocuments(filter),
    ]);
    res.json(paginated(records, total, page, limit));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
