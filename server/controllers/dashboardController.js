const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Training = require('../models/Training');
const Notification = require('../models/Notification');
const { getTeamIds, startOfDay, endOfDay } = require('../utils/helpers');

// "Active" trainings = status Upcoming (the schema has no "ongoing" state)
const ACTIVE = 'Upcoming';

const attendanceBreakdown = async (userFilter) => {
  const day = { $gte: startOfDay(), $lte: endOfDay() };
  const base = { date: day, ...userFilter };
  const [present, late] = await Promise.all([
    Attendance.countDocuments({ ...base, status: 'Present' }),
    Attendance.countDocuments({ ...base, status: 'Late' }),
  ]);
  return { present, late, checkedIn: present + late };
};

// GET /api/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    const { role, _id } = req.user;
    const unreadNotifications = await Notification.countDocuments({ userId: _id, isRead: false });
    let stats;

    if (role === 'hr') {
      const [totalEmployees, totalManagers, totalUsers, pendingLeaves, activeTrainings, today] = await Promise.all([
        User.countDocuments({ role: 'employee' }),
        User.countDocuments({ role: 'manager' }),
        User.countDocuments({}),
        Leave.countDocuments({ status: 'Pending' }),
        Training.countDocuments({ status: ACTIVE }),
        attendanceBreakdown({}),
      ]);
      stats = {
        totalEmployees,
        totalManagers,
        pendingLeaves,
        activeTrainings,
        todayAttendance: { ...today, notCheckedIn: Math.max(totalUsers - today.checkedIn, 0) },
      };
    } else if (role === 'manager') {
      const teamIds = await getTeamIds(_id);
      const [pendingLeaves, activeTrainings, today] = await Promise.all([
        Leave.countDocuments({ userId: { $in: teamIds }, status: 'Pending' }),
        Training.countDocuments({ status: ACTIVE, $or: [{ assignedBy: _id }, { participants: _id }] }),
        attendanceBreakdown({ userId: { $in: teamIds } }),
      ]);
      stats = {
        totalEmployees: teamIds.length, // team size
        pendingLeaves,                  // team requests awaiting this manager
        activeTrainings,
        todayAttendance: { ...today, notCheckedIn: Math.max(teamIds.length - today.checkedIn, 0) },
      };
    } else {
      const [pendingLeaves, approvedLeaves, activeTrainings, record] = await Promise.all([
        Leave.countDocuments({ userId: _id, status: 'Pending' }),
        Leave.countDocuments({ userId: _id, status: 'Approved' }),
        Training.countDocuments({ status: ACTIVE, participants: _id }),
        Attendance.findOne({ userId: _id, date: startOfDay() }).select('checkIn checkOut status'),
      ]);
      stats = {
        pendingLeaves,
        approvedLeaves,
        activeTrainings, // upcoming trainings I'm enrolled in
        todayAttendance: record
          ? { marked: true, status: record.status, checkIn: record.checkIn, checkOut: record.checkOut }
          : { marked: false },
      };
    }

    res.json({ role, stats: { ...stats, unreadNotifications } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
