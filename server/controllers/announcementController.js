const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const { parsePagination, paginated } = require('../utils/helpers');

// POST /api/announcements  (HR)
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content || !String(title).trim() || !String(content).trim()) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }
    const announcement = await Announcement.create({ title, content, postedBy: req.user._id });
    res.status(201).json({ message: 'Announcement posted.', announcement });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/announcements?page=&limit=   (all roles)
exports.getAnnouncements = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const [items, total] = await Promise.all([
      Announcement.find()
        .populate('postedBy', 'name role designation')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Announcement.countDocuments(),
    ]);
    res.json(paginated(items, total, page, limit));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/announcements/:id  (HR)
exports.updateAnnouncement = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
    const update = {};
    if (req.body.title !== undefined) update.title = req.body.title;
    if (req.body.content !== undefined) update.content = req.body.content;
    if (!Object.keys(update).length) return res.status(400).json({ message: 'Nothing to update.' });

    const announcement = await Announcement.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
    res.json({ message: 'Announcement updated.', announcement });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// DELETE /api/announcements/:id  (HR)
exports.deleteAnnouncement = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid id.' });
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Announcement not found.' });
    res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
