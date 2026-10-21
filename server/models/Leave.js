const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leaveType: { type: String, required: true, enum: ['Sick', 'Casual', 'Annual', 'Maternity', 'Paternity', 'Unpaid'] },
    startDate: { type: Date, required: true },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) { return !this.startDate || v >= this.startDate; },
        message: 'End date must be on or after start date',
      },
    },
    reason: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', index: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leave', leaveSchema);
