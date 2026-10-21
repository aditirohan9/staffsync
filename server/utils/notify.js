const Notification = require('../models/Notification');

// Never lets a notification failure break the main request
const createNotification = async (userId, message) => {
  try {
    return await Notification.create({ userId, message });
  } catch (err) {
    console.error('Notification error:', err.message);
    return null;
  }
};

// Same message to many users
const createNotifications = async (userIds, message) => {
  try {
    if (!userIds.length) return [];
    return await Notification.insertMany(userIds.map((userId) => ({ userId, message })));
  } catch (err) {
    console.error('Notification error:', err.message);
    return [];
  }
};

module.exports = { createNotification, createNotifications };
