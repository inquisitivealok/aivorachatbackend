const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Message = require('../models/Message');
const router = express.Router();

const SHARED_USER_ID = 'aivora_default_user';

const getMockResponse = (userMessage) => {
  const msg = userMessage.toLowerCase();
  if (msg.includes('hello') || msg.includes('hi')) return "Hello! I'm AI Vora, your study assistant. How can I help you today? 📚";
  if (msg.includes('math') || msg.includes('calculus')) return "Great question about math! Let's break it down step by step. What specific topic are you working on?";
  if (msg.includes('physics')) return "Physics can be challenging but rewarding! Are you working on mechanics, thermodynamics, or another area?";
  if (msg.includes('study') || msg.includes('schedule')) return "Effective studying involves spaced repetition, active recall, and regular breaks. Would you like me to help you create a study plan?";
  if (msg.includes('help')) return "I'm here to help! I can assist with study strategies, explain concepts, help with scheduling, and keep you motivated. What do you need?";
  return `That's an interesting question! As your AI study assistant, I'd suggest breaking this topic into smaller parts and tackling each one systematically. Could you provide more details so I can give you a more specific answer?`;
};

router.post('/send', async (req, res) => {
  try {
    const { message } = req.body;
    await Message.create({ userId: SHARED_USER_ID, role: 'user', content: message });

    let aiResponse;

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        systemInstruction: 'You are AI Vora, a helpful and friendly student productivity assistant. Help students with their studies, explain concepts clearly, and keep them motivated.'
      });

      // Build chat history for context (exclude the message we just saved)
      const history = await Message.find({ userId: SHARED_USER_ID })
        .sort({ createdAt: 1 })
        .limit(20);

      // Gemini requires history to start with 'user' and alternate roles
      const chatHistory = [];
      for (const m of history.slice(0, -1)) { // exclude last (current user msg)
        chatHistory.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        });
      }

      const chat = model.startChat({ history: chatHistory });
      const result = await chat.sendMessage(message);
      aiResponse = result.response.text();
    } else {
      aiResponse = getMockResponse(message);
    }

    await Message.create({ userId: SHARED_USER_ID, role: 'assistant', content: aiResponse });
    res.json({ response: aiResponse });
  } catch (err) {
    console.error('Gemini error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const messages = await Message.find({ userId: SHARED_USER_ID }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/history', async (req, res) => {
  try {
    await Message.deleteMany({ userId: SHARED_USER_ID });
    res.json({ message: 'Chat history cleared' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
