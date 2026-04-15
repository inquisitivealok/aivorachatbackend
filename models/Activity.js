const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  alertSentAt: { type: Date, default: null }
});

module.exports = mongoose.model('Activity', activitySchema);
