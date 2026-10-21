const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Notification = require('../models/Notification');
const Training = require('../models/Training');
const { parsePagination, paginated, escapeRegex } = require('../utils/helpers');

const ROLES = User.schema.path('role').enumValues;

// GET /api/users?page=&limit=&role=&department=&search=
// HR -> everyone, Manager -> only their direct reports
exports.getUsers = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = {};

    if (req.user.role === 'manager') filter.managerId = req.user._id;
    if (req.query.role && ROLES.includes(req.query.role)) filter.role = req.query.role;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.search) {
      const rx = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = [{ name: rx }, { email: rx }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .populate('managerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json(paginated(users, total, page, limit));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/users/:id
// HR -> can edit any user and any field (incl. role). Others -> only themselves (name/email/password)
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid user id.' });

    const isHR = req.user.role === 'hr';
    const isSelf = req.user._id.toString() === id;
    if (!isHR && !isSelf) return res.status(403).json({ message: 'You can only update your own profile.' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const allowed = isHR
      ? ['name', 'email', 'designation', 'department', 'managerId', 'joiningDate', 'role', 'password']
      : ['name', 'email', 'password'];

    // Role change checks
    if (req.body.role !== undefined && req.body.role !== user.role) {
      if (!isHR) return res.status(403).json({ message: 'Only HR can change roles.' });
      if (!ROLES.includes(req.body.role)) return res.status(400).json({ message: `Role must be one of: ${ROLES.join(', ')}` });
      if (isSelf) return res.status(400).json({ message: 'You cannot change your own role.' });
    }

    // Manager assignment check
    if (isHR && req.body.managerId) {
      if (!mongoose.isValidObjectId(req.body.managerId)) return res.status(400).json({ message: 'Invalid managerId.' });
      if (req.body.managerId === id) return res.status(400).json({ message: 'A user cannot be their own manager.' });
      const mgr = await User.findById(req.body.managerId);
      if (!mgr || mgr.role !== 'manager') return res.status(400).json({ message: 'managerId must belong to a user with role "manager".' });
    }

    if (req.body.password !== undefined && String(req.body.password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    allowed.forEach((field) => {
      if (req.body[field] === undefined) return;
      user[field] = field === 'managerId' && !req.body[field] ? null : req.body[field];
    });

    await user.save(); // runs validators + password hashing hook

    const result = user.toObject();
    delete result.password;
    res.json({ message: 'User updated.', user: result });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email already in use.' });
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/users/:id  (HR only)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid user id.' });
    if (req.user._id.toString() === id) return res.status(400).json({ message: 'You cannot delete your own account.' });

    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Clean up related data
    await Promise.all([
      Attendance.deleteMany({ userId: id }),
      Leave.deleteMany({ userId: id }),
      Notification.deleteMany({ userId: id }),
      User.updateMany({ managerId: id }, { $set: { managerId: null } }),
      Training.updateMany({ participants: id }, { $pull: { participants: id } }),
    ]);

    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
