const express = require('express');
const Schedule = require('../models/Schedule');
const router = express.Router();

const SHARED_USER_ID = 'aivora_default_user';

router.get('/', async (req, res) => {
  try {
    const schedules = await Schedule.find({ userId: SHARED_USER_ID }).sort({ createdAt: -1 });
    res.json(schedules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, startTime, endTime, days, topics } = req.body;
    const schedule = await Schedule.create({ userId: SHARED_USER_ID, title, startTime, endTime, days, topics });
    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndUpdate(
      { _id: req.params.id, userId: SHARED_USER_ID },
      req.body,
      { new: true }
    );
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json(schedule);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const schedule = await Schedule.findOneAndDelete({ _id: req.params.id, userId: SHARED_USER_ID });
    if (!schedule) return res.status(404).json({ message: 'Schedule not found' });
    res.json({ message: 'Schedule deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
