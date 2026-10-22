// Populates the database with demo data for evaluation.
//   npm run seed              -> only runs on an empty database
//   npm run seed -- --reset   -> WIPES all collections first, then seeds
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const Announcement = require('./models/Announcement');
const Training = require('./models/Training');
const Notification = require('./models/Notification');

// Override for public deployments:  SEED_PASSWORD=... SEED_HR_PASSWORD=... npm run seed
const PASSWORD = process.env.SEED_PASSWORD || 'Password@123';
const HR_PASSWORD = process.env.SEED_HR_PASSWORD || 'Admin@123';

const startOfDay = (d = new Date()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (n) => { const d = startOfDay(); d.setDate(d.getDate() + n); return d; };
const at = (day, h, m) => { const d = new Date(day); d.setHours(h, m, 0, 0); return d; };
const iso = (d) => new Date(d).toISOString().slice(0, 10);

// ---- builders (pure functions, easy to validate without a database) ----
// users = [hr, manager, emp1, emp2]
const buildAttendance = (users) => {
  const records = [];
  users.forEach((u, k) => {
    for (let d = 0; d <= 20; d++) {
      const day = addDays(-d);
      const dow = day.getDay();
      if (dow === 0 || dow === 6) continue; // skip weekends

      if (d === 0) { // today: HR on time, manager late, emp1 on time, emp2 hasn't checked in yet
        if (k === 0) records.push({ userId: u._id, date: day, checkIn: at(day, 9, 4), status: 'Present' });
        if (k === 1) records.push({ userId: u._id, date: day, checkIn: at(day, 9, 47), status: 'Late' });
        if (k === 2) records.push({ userId: u._id, date: day, checkIn: at(day, 9, 12), status: 'Present' });
        continue;
      }
      if (k === 3 && d === 6) { records.push({ userId: u._id, date: day, status: 'Absent' }); continue; }

      const late = (d * 3 + k) % 7 === 0;
      records.push({
        userId: u._id,
        date: day,
        checkIn: late ? at(day, 9, 35 + ((d * 5) % 40)) : at(day, 9, (d * 7 + k * 3) % 25),
        checkOut: at(day, 17, 30 + ((d * 11 + k * 5) % 60)),
        status: late ? 'Late' : 'Present',
      });
    }
  });
  return records;
};

const buildLeaves = ([, manager, emp1, emp2]) => [
  { userId: emp1._id, leaveType: 'Casual', startDate: addDays(-12), endDate: addDays(-11), reason: 'Family function out of town', status: 'Approved', approvedBy: manager._id },
  { userId: emp1._id, leaveType: 'Sick', startDate: addDays(5), endDate: addDays(6), reason: 'Scheduled medical check-up', status: 'Pending' },
  { userId: emp1._id, leaveType: 'Annual', startDate: addDays(-30), endDate: addDays(-28), reason: 'Short trip', status: 'Rejected', approvedBy: manager._id },
  { userId: emp2._id, leaveType: 'Annual', startDate: addDays(10), endDate: addDays(14), reason: 'Vacation with family', status: 'Pending' },
  { userId: emp2._id, leaveType: 'Sick', startDate: addDays(-5), endDate: addDays(-5), reason: 'Fever', status: 'Approved', approvedBy: manager._id },
  { userId: manager._id, leaveType: 'Annual', startDate: addDays(20), endDate: addDays(24), reason: 'Personal travel', status: 'Pending' }, // HR approves this
];

const buildAnnouncements = ([hr]) => [
  { title: 'Welcome to StaffSync', content: 'StaffSync is now our single place for attendance, leave requests and company news. Please mark your attendance daily and keep your profile up to date.', postedBy: hr._id, createdAt: addDays(-10) },
  { title: 'Diwali Holiday Schedule', content: 'The office will remain closed on the festival days. Please plan your leave requests and handovers in advance.', postedBy: hr._id, createdAt: addDays(-4) },
  { title: 'Quarterly Town Hall', content: 'Join us this Friday at 4 PM for the quarterly town hall. Leadership will share company updates and answer your questions.', postedBy: hr._id, createdAt: addDays(-1) },
];

const buildTrainings = ([hr, manager, emp1, emp2]) => [
  { title: 'Secure Coding Workshop', description: 'Hands-on session covering OWASP Top 10 and secure API design.', assignedBy: manager._id, participants: [emp1._id], status: 'Upcoming' },
  { title: 'Effective Communication', description: 'Improve written and verbal communication in cross-team projects.', assignedBy: hr._id, participants: [], status: 'Upcoming' },
  { title: 'Onboarding & Company Culture', description: 'Introduction to company values, policies and tools.', assignedBy: hr._id, participants: [manager._id, emp1._id, emp2._id], status: 'Completed' },
];

const buildNotifications = ([, manager, emp1, emp2]) => [
  { userId: emp1._id, message: `Your Casual leave (${iso(addDays(-12))} to ${iso(addDays(-11))}) was approved by ${manager.name}.`, isRead: false },
  { userId: emp1._id, message: `You have been added to the training "Secure Coding Workshop" by ${manager.name}.`, isRead: false },
  { userId: emp2._id, message: `Your Sick leave (${iso(addDays(-5))} to ${iso(addDays(-5))}) was approved by ${manager.name}.`, isRead: true },
  { userId: manager._id, message: `${emp1.name} applied for Sick leave (${iso(addDays(5))} to ${iso(addDays(6))}).`, isRead: false },
  { userId: manager._id, message: `${emp2.name} applied for Annual leave (${iso(addDays(10))} to ${iso(addDays(14))}).`, isRead: false },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const models = [User, Attendance, Leave, Announcement, Training, Notification];

  if (process.argv.includes('--reset')) {
    await Promise.all(models.map((M) => M.deleteMany({})));
    await Promise.all(models.map((M) => M.syncIndexes())); // drops stale indexes, creates the new ones
    console.log('Existing data wiped.');
  } else if (await User.countDocuments()) {
    console.log('Database already has users. Re-run with "npm run seed -- --reset" to wipe and reseed.');
    return mongoose.disconnect();
  }

  // User.create (not insertMany) so the password-hashing hook runs
  const [hr, manager] = await User.create([
    { name: 'Priya Sharma', email: 'hr@staffsync.com', password: HR_PASSWORD, role: 'hr', department: 'Human Resources', designation: 'HR Manager', phone: '+91 98260 11111', joiningDate: addDays(-900) },
    { name: 'Rahul Verma', email: 'manager@staffsync.com', password: PASSWORD, role: 'manager', department: 'Engineering', designation: 'Engineering Manager', phone: '+91 98260 22222', joiningDate: addDays(-700) },
  ]);
  const [emp1, emp2] = await User.create([
    { name: 'Ananya Singh', email: 'employee1@staffsync.com', password: PASSWORD, role: 'employee', department: 'Engineering', designation: 'Software Engineer', managerId: manager._id, bio: 'Full-stack developer who loves clean APIs.', joiningDate: addDays(-400) },
    { name: 'Karan Mehta', email: 'employee2@staffsync.com', password: PASSWORD, role: 'employee', department: 'Design', designation: 'UI Designer', managerId: manager._id, joiningDate: addDays(-250) },
  ]);

  const users = [hr, manager, emp1, emp2];
  await Attendance.insertMany(buildAttendance(users));
  await Leave.insertMany(buildLeaves(users));
  await Announcement.insertMany(buildAnnouncements(users));
  await Training.insertMany(buildTrainings(users));
  await Notification.insertMany(buildNotifications(users));

  console.log('\nSeed complete. Demo logins:');
  console.log(`  HR        hr@staffsync.com         / ${HR_PASSWORD}`);
  console.log(`  Manager   manager@staffsync.com    / ${PASSWORD}`);
  console.log(`  Employee  employee1@staffsync.com  / ${PASSWORD}`);
  console.log(`  Employee  employee2@staffsync.com  / ${PASSWORD}   (has not checked in today)`);
  await mongoose.disconnect();
}

module.exports = { buildAttendance, buildLeaves, buildAnnouncements, buildTrainings, buildNotifications };

if (require.main === module) {
  main().catch((err) => { console.error('Seed failed:', err.message); process.exit(1); });
}
