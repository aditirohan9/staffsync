const mongoose = require('mongoose');
const Training = require('../models/Training');
const User = require('../models/User');
const { parsePagination, paginated } = require('../utils/helpers');
const { createNotification, createNotifications } = require('../utils/notify');

const STATUSES = Training.schema.path('status').enumValues;
const canManage = (user, training) =>
  user.role === 'hr' || training.assignedBy.toString() === user._id.toString();

// POST /api/trainings  (Manager/HR)   body: { title, description, participants?: [userId], status? }
exports.createTraining = async (req, res) => {
  try {
    const { title, description, status } = req.body;
    let participants = req.body.participants || [];

    if (!title || !String(title).trim()) return res.status(400).json({ message: 'Title is required.' });
    if (status && !STATUSES.includes(status)) return res.status(400).json({ message: `status must be one of: ${STATUSES.join(', ')}` });
    if (!Array.isArray(participants)) return res.status(400).json({ message: 'participants must be an array of user ids.' });

    participants = [...new Set(participants.map(String))];
    if (participants.some((p) => !mongoose.isValidObjectId(p))) {
      return res.status(400).json({ message: 'participants contains an invalid user id.' });
    }

    if (participants.length) {
      const users = await User.find({ _id: { $in: participants } }).select('_id managerId');
      if (users.length !== participants.length) return res.status(400).json({ message: 'One or more participants do not exist.' });
      if (req.user.role === 'manager') {
        const outsider = users.some((u) => String(u.managerId) !== String(req.user._id));
        if (outsider) return res.status(403).json({ message: 'Managers can only add members of their own team.' });
      }
    }

    const training = await Training.create({
      title, description, status, participants, assignedBy: req.user._id,
    });

    await createNotifications(participants, `You have been added to the training "${training.title}" by ${req.user.name}.`);

    res.status(201).json({ message: 'Training created.', training });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/trainings?status=&mine=true&page=&limit=   (all roles)
// Everyone can browse all trainings (so employees can find ones to enroll in).
exports.getTrainings = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const me = req.user._id;
    const filter = {};

    if (req.query.status) {
      if (!STATUSES.includes(req.query.status)) return res.status(400).json({ message: `status must be one of: ${STATUSES.join(', ')}` });
      filter.status = req.query.status;
    }
    if (req.query.mine === 'true') filter.$or = [{ participants: me }, { assignedBy: me }];

    const showParticipants = req.user.role !== 'employee';
    let query = Training.find(filter)
      .populate('assignedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    if (showParticipants) query = query.populate('participants', 'name email');

    const [trainings, total] = await Promise.all([query.lean(), Training.countDocuments(filter)]);

    const data = trainings.map((t) => {
      const isEnrolled = t.participants.some((p) => String(p._id || p) === String(me));
      const out = { ...t, participantCount: t.participants.length, isEnrolled };
      if (!showParticipants) delete out.participants; // employees only see counts
      return out;
    });

    res.json(paginated(data, total, page, limit));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/trainings/:id/enroll  (Employee/Manager)
exports.enroll = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid training id.' });

    const training = await Training.findById(id);
    if (!training) return res.status(404).json({ message: 'Training not found.' });
    if (training.status !== 'Upcoming') return res.status(400).json({ message: 'Enrollment is only open for upcoming trainings.' });
    if (training.participants.some((p) => p.equals(req.user._id))) {
      return res.status(409).json({ message: 'You are already enrolled in this training.' });
    }

    const updated = await Training.findOneAndUpdate(
      { _id: id, status: 'Upcoming' },
      { $addToSet: { participants: req.user._id } },
      { new: true }
    );
    if (!updated) return res.status(400).json({ message: 'Enrollment is closed.' });

    if (updated.assignedBy.toString() !== req.user._id.toString()) {
      await createNotification(updated.assignedBy, `${req.user.name} enrolled in "${updated.title}".`);
    }

    res.json({
      message: 'Enrolled successfully.',
      training: { _id: updated._id, title: updated.title, status: updated.status, participantCount: updated.participants.length },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/trainings/:id  (creator or HR)  body: { title?, description?, status? }
exports.updateTraining = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid training id.' });

    const training = await Training.findById(id);
    if (!training) return res.status(404).json({ message: 'Training not found.' });
    if (!canManage(req.user, training)) return res.status(403).json({ message: 'Only the creator or HR can edit this training.' });

    if (req.body.status && !STATUSES.includes(req.body.status)) {
      return res.status(400).json({ message: `status must be one of: ${STATUSES.join(', ')}` });
    }
    ['title', 'description', 'status'].forEach((f) => {
      if (req.body[f] !== undefined) training[f] = req.body[f];
    });
    await training.save();

    res.json({ message: 'Training updated.', training });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/trainings/:id  (creator or HR)
exports.deleteTraining = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid training id.' });

    const training = await Training.findById(id);
    if (!training) return res.status(404).json({ message: 'Training not found.' });
    if (!canManage(req.user, training)) return res.status(403).json({ message: 'Only the creator or HR can delete this training.' });

    await training.deleteOne();
    res.json({ message: 'Training deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
