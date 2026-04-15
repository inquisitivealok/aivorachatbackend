const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendInactivityAlert = async (email, name) => {
  await transporter.sendMail({
    from: `"AI Vora" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '⚠️ Study Time Alert - AI Vora',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;background:#1a1a2e;color:#fff;border-radius:12px;padding:30px;">
        <h2 style="color:#a78bfa;">📚 AI Vora - Study Alert</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p style="font-size:16px;">You are missing your study time. Please stay focused!</p>
        <p style="color:#a78bfa;">Your scheduled study session is currently active but you appear to be inactive.</p>
        <a href="#" style="display:inline-block;margin-top:15px;padding:10px 20px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;">Go Back to Study →</a>
        <p style="margin-top:20px;font-size:12px;color:#888;">This alert was sent by AI Vora productivity tracker.</p>
      </div>
    `
  });
};

module.exports = { sendInactivityAlert };
