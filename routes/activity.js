const express = require('express');
const Activity = require('../models/Activity');
const router = express.Router();

const SHARED_USER_ID = 'aivora_default_user';

router.post('/ping', async (req, res) => {
  try {
    const { isActive } = req.body;
    const activity = await Activity.findOneAndUpdate(
      { userId: SHARED_USER_ID },
      { isActive, lastSeen: new Date() },
      { upsert: true, new: true }
    );
    res.json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/status', async (req, res) => {
  try {
    const activity = await Activity.findOne({ userId: SHARED_USER_ID });
    res.json(activity || { isActive: false, lastSeen: null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
