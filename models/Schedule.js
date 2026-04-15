const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  days: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema);
