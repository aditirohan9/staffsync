const mongoose = require('mongoose');
const Leave = require('../models/Leave');
const { parsePagination, paginated, getTeamIds, isValidDate } = require('../utils/helpers');
const { createNotification } = require('../utils/notify');

const LEAVE_TYPES = Leave.schema.path('leaveType').enumValues;
const STATUSES = Leave.schema.path('status').enumValues;
const fmt = (d) => new Date(d).toISOString().slice(0, 10);

// POST /api/leaves
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'leaveType, startDate, endDate and reason are required.' });
    }
    if (!LEAVE_TYPES.includes(leaveType)) {
      return res.status(400).json({ message: `leaveType must be one of: ${LEAVE_TYPES.join(', ')}` });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isValidDate(start) || !isValidDate(end)) return res.status(400).json({ message: 'Invalid date format.' });
    if (end < start) return res.status(400).json({ message: 'End date must be on or after start date.' });

    // Block overlapping Pending/Approved leaves
    const overlap = await Leave.findOne({
      userId: req.user._id,
      status: { $in: ['Pending', 'Approved'] },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });
    if (overlap) return res.status(409).json({ message: 'You already have a leave request overlapping these dates.' });

    const leave = await Leave.create({ userId: req.user._id, leaveType, startDate: start, endDate: end, reason });

    // Let the manager know
    if (req.user.managerId) {
      await createNotification(
        req.user.managerId,
        `${req.user.name} applied for ${leaveType} leave (${fmt(start)} to ${fmt(end)}).`
      );
    }

    res.status(201).json({ message: 'Leave request submitted.', leave });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/leaves?status=&userId=&page=&limit=
// Employee -> own, Manager -> team + own, HR -> all
exports.getLeaves = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {};
    const { role, _id } = req.user;

    if (req.query.status) {
      if (!STATUSES.includes(req.query.status)) return res.status(400).json({ message: `status must be one of: ${STATUSES.join(', ')}` });
      filter.status = req.query.status;
    }

    if (req.query.userId && !mongoose.isValidObjectId(req.query.userId)) {
      return res.status(400).json({ message: 'Invalid userId.' });
    }

    if (role === 'employee') {
      filter.userId = _id;
    } else if (role === 'manager') {
      const visible = [...(await getTeamIds(_id)), _id];
      if (req.query.userId) {
        if (!visible.some((id) => id.toString() === req.query.userId)) {
          return res.status(403).json({ message: 'That user is not in your team.' });
        }
        filter.userId = req.query.userId;
      } else {
        filter.userId = { $in: visible };
      }
    } else if (req.query.userId) {
      filter.userId = req.query.userId; // HR
    }

    const [leaves, total] = await Promise.all([
      Leave.find(filter)
        .populate('userId', 'name email department designation')
        .populate('approvedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Leave.countDocuments(filter),
    ]);

    res.json(paginated(leaves, total, page, limit));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/leaves/:id/status   body: { status: "Approved" | "Rejected" }
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid leave id.' });
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be "Approved" or "Rejected".' });
    }

    const leave = await Leave.findById(id).populate('userId', 'name managerId');
    if (!leave || !leave.userId) return res.status(404).json({ message: 'Leave request not found.' });

    // Nobody approves their own leave
    if (leave.userId._id.equals(req.user._id)) {
      return res.status(403).json({ message: 'You cannot approve or reject your own leave.' });
    }
    // Managers only handle their own team
    if (req.user.role === 'manager' && String(leave.userId.managerId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'This employee is not in your team.' });
    }
    if (leave.status !== 'Pending') {
      return res.status(400).json({ message: `Leave has already been ${leave.status.toLowerCase()}.` });
    }

    // Atomic update: only succeeds if still Pending (guards against double-clicks / two approvers)
    const updated = await Leave.findOneAndUpdate(
      { _id: id, status: 'Pending' },
      { status, approvedBy: req.user._id },
      { new: true }
    );
    if (!updated) return res.status(409).json({ message: 'Leave was already processed.' });

    await createNotification(
      leave.userId._id,
      `Your ${updated.leaveType} leave (${fmt(updated.startDate)} to ${fmt(updated.endDate)}) was ${status.toLowerCase()} by ${req.user.name}.`
    );

    res.json({ message: `Leave ${status.toLowerCase()}.`, leave: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
