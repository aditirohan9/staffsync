// Creates the first HR account:  npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = 'hr@staffsync.com';
  if (await User.findOne({ email })) {
    console.log('HR user already exists');
  } else {
    await User.create({
      name: 'HR Admin', email, password: 'Admin@123',
      role: 'hr', designation: 'HR Manager', department: 'Human Resources',
    });
    console.log(`HR user created -> ${email} / Admin@123 (change this password)`);
  }
  await mongoose.disconnect();
})();
