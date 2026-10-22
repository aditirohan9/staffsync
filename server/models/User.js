const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never returned by default
    },
    role: { type: String, enum: ['employee', 'manager', 'hr'], default: 'employee' },
    designation: { type: String, trim: true },
    department: { type: String, trim: true, index: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    joiningDate: { type: Date, default: Date.now },
    phone: {
      type: String,
      trim: true,
      validate: { validator: (v) => !v || /^[0-9+\-\s()]{7,20}$/.test(v), message: 'Please provide a valid phone number' },
    },
    address: { type: String, trim: true, maxlength: [200, 'Address is too long (max 200 characters)'] },
    bio: { type: String, trim: true, maxlength: [500, 'Bio is too long (max 500 characters)'] },
  },
  { timestamps: true }
);

// Hash password whenever it is created or changed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
