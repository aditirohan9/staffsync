const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true }, // store normalized to 00:00 of the day
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Present' },
  },
  { timestamps: true }
);

// One record per user per day; newest-first reads (history pages) use this index
attendanceSchema.index({ userId: 1, date: -1 }, { unique: true });
// Company-wide / team queries filtered by date
attendanceSchema.index({ date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
