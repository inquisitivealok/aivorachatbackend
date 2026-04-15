const cron = require('node-cron');
const Activity = require('../models/Activity');
const Schedule = require('../models/Schedule');
const { sendInactivityAlert } = require('../utils/mailer');

const SHARED_USER_ID = 'aivora_default_user';

const isWithinSchedule = (schedules) => {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.toTimeString().slice(0, 5);
  return schedules.some(s => {
    const daysMatch = !s.days?.length || s.days.includes(currentDay);
    return daysMatch && currentTime >= s.startTime && currentTime <= s.endTime;
  });
};

const startCronJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const activity = await Activity.findOne({
        userId: SHARED_USER_ID,
        isActive: false,
        lastSeen: { $lt: fiveMinutesAgo }
      });
      if (!activity) return;

      const schedules = await Schedule.find({ userId: SHARED_USER_ID });
      if (!isWithinSchedule(schedules)) return;

      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (activity.alertSentAt && activity.alertSentAt > thirtyMinAgo) return;

      const email = process.env.EMAIL_USER;
      await sendInactivityAlert(email, 'Student');
      await Activity.findByIdAndUpdate(activity._id, { alertSentAt: new Date() });
      console.log(`Inactivity alert sent to ${email}`);
    } catch (err) {
      console.error('Cron job error:', err.message);
    }
  });
  console.log('Cron job started - checking inactivity every 5 minutes');
};

module.exports = { startCronJob };
