require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { startCronJob } = require('./utils/cron');

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/chat', require('./routes/chat'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/activity', require('./routes/activity'));

app.get('/api/health', (req, res) => res.json({ status: 'AI Vora backend running ✅' }));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected ✅');
    startCronJob();
    app.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT} 🚀`));
  })
  .catch(err => console.error('MongoDB connection error:', err));
