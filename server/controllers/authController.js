const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  designation: user.designation,
  department: user.department,
  managerId: user.managerId,
  joiningDate: user.joiningDate,
});

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, designation, department, managerId, joiningDate } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Public sign-up may only create employee/manager accounts.
    // HR accounts are created via the seed script or by an existing HR user.
    const safeRole = role === 'manager' ? 'manager' : 'employee';

    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const user = await User.create({
      name, email, password, role: safeRole, designation, department, managerId, joiningDate,
    });

    res.status(201).json({ token: signToken(user), user: userResponse(user) });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    res.json({ token: signToken(user), user: userResponse(user) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/auth/me
exports.getMe = (req, res) => res.json({ user: req.user });
