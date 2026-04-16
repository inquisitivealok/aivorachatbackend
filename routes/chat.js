const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Message = require('../models/Message');
const router = express.Router();

const SHARED_USER_ID = 'aivora_default_user';

const buildLearningInstruction = (learningContext = {}) => {
  if (!learningContext || !learningContext.active) return '';

  const stage = learningContext.stage || 'teaching';
  const topic = learningContext.topic || '';
  const topicNumber = learningContext.topicNumber || '';
  const totalTopics = learningContext.totalTopics || '';
  const subtopicNumber = learningContext.subtopicNumber || '';
  const totalSubtopics = learningContext.totalSubtopics || '';
  const sessionTitle = learningContext.sessionTitle || 'Study Session';

  return `
Learning session context (strict):
- Session: ${sessionTitle}
- Stage: ${stage}
- Current topic: ${topic || 'N/A'} (${topicNumber || '?'} of ${totalTopics || '?'})
- Current subtopic: ${subtopicNumber || '?'} of ${totalSubtopics || '?'}

Rules for this response:
- Stay on the current stage/topic only; do not jump ahead.
- If stage is "roadmap", provide roadmap only and ask user to type "done".
- If stage is "teaching", teach ONLY the current subtopic using this structure:
  1) Concept (2-4 lines)
  2) Example (short)
  3) Quick Practice (1 question)
  4) End with: Type "done" for next.
- Keep response concise and directly useful for learning.
`;
};

const getMockResponse = (userMessage) => {
  return `You asked: "${userMessage}". I'm here to help with anything — just ask!`;
};

router.post('/send', async (req, res) => {
  try {
    const { message, learningContext } = req.body;
    await Message.create({ userId: SHARED_USER_ID, role: 'user', content: message });

    let aiResponse;

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: `You are AI Vora, a highly capable general assistant.

Core behavior:
- Answer any question or request the user gives you, on any topic.
- Always respond directly based on the user's latest message and intent.
- Use conversation history to stay consistent and context-aware.
- Never refuse a reasonable request or redirect unnecessarily.
- If the user asks about coding, science, math, history, creative writing, or anything else — help fully.

Response style:
- Be clear, concise, and accurate.
- Use examples or step-by-step explanations when helpful.
- Match the tone to the request: casual for casual, detailed for technical.
- Do not add unnecessary filler or repeat yourself.
`
        });

        const history = await Message.find({ userId: SHARED_USER_ID })
          .sort({ createdAt: 1 })
          .limit(20);

        const chatHistory = [];
        for (const m of history.slice(0, -1)) {
          chatHistory.push({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
          });
        }

        const chat = model.startChat({ history: chatHistory });
        const learningInstruction = buildLearningInstruction(learningContext);
        const finalPrompt = learningInstruction
          ? `${learningInstruction}\n\nUser message:\n${message}`
          : message;
        const result = await chat.sendMessage(finalPrompt);
        aiResponse = result.response.text();
      } catch (geminiErr) {
        console.error('Gemini unavailable, using fallback response:', geminiErr.message);
        aiResponse = getMockResponse(message);
      }
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


// const express = require('express');
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const Message = require('../models/Message');
// const router = express.Router();

// const SHARED_USER_ID = 'aivora_default_user';

// const buildLearningInstruction = (learningContext = {}) => {
//   if (!learningContext || !learningContext.active) return '';

//   const stage = learningContext.stage || 'teaching';
//   const topic = learningContext.topic || '';
//   const topicNumber = learningContext.topicNumber || '';
//   const totalTopics = learningContext.totalTopics || '';
//   const subtopicNumber = learningContext.subtopicNumber || '';
//   const totalSubtopics = learningContext.totalSubtopics || '';
//   const sessionTitle = learningContext.sessionTitle || 'Study Session';

//   return `
// Learning session context (strict):
// - Session: ${sessionTitle}
// - Stage: ${stage}
// - Current topic: ${topic || 'N/A'} (${topicNumber || '?'} of ${totalTopics || '?'})
// - Current subtopic: ${subtopicNumber || '?'} of ${totalSubtopics || '?'}

// Rules for this response:
// - Stay on the current stage/topic only; do not jump ahead.
// - If stage is "roadmap", provide roadmap only and ask user to type "done".
// - If stage is "teaching", teach ONLY the current subtopic using this structure:
//   1) Concept (2-4 lines)
//   2) Example (short)
//   3) Quick Practice (1 question)
//   4) End with: Type "done" for next.
// - Keep response concise and directly useful for learning.
// `;
// };

// const getMockResponse = (userMessage) => {
//   const msg = userMessage.toLowerCase();
//   if (msg.includes('hello') || msg.includes('hi')) return "Hello! I'm AI Vora, your study assistant. How can I help you today? 📚";
//   if (msg.includes('math') || msg.includes('calculus')) return "Great question about math! Let's break it down step by step. What specific topic are you working on?";
//   if (msg.includes('physics')) return "Physics can be challenging but rewarding! Are you working on mechanics, thermodynamics, or another area?";
//   if (msg.includes('study') || msg.includes('schedule')) return "Effective studying involves spaced repetition, active recall, and regular breaks. Would you like me to help you create a study plan?";
//   if (msg.includes('help')) return "I'm here to help! I can assist with study strategies, explain concepts, help with scheduling, and keep you motivated. What do you need?";
//   return `I understand your request: "${userMessage}". I will answer based on this exact input and your current chat context. If you want to continue step-by-step, reply "done".`;
// };

// router.post('/send', async (req, res) => {
//   try {
//     const { message, learningContext } = req.body;
//     await Message.create({ userId: SHARED_USER_ID, role: 'user', content: message });

//     let aiResponse;

//     if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
//       try {
//         const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
//         const model = genAI.getGenerativeModel({
//           model: 'gemini-2.0-flash',
//           systemInstruction: `You are AI Vora, a focused study assistant.

// Core behavior:
// - Always answer according to the user's latest message and intent.
// - Prioritize the exact topic, task, and constraints given by the user in this chat.
// - Use recent conversation context to stay consistent; do not ignore user instructions.
// - Do not switch to unrelated generic advice unless the user asks.
// - If the user says "done", continue from the previous learning step/topic instead of restarting.

// Response style:
// - Be clear, concise, and practical.
// - For study requests, explain step-by-step with simple language and examples.
// - Ask one short follow-up question only when needed for missing info.
// - Keep motivational tone brief; focus on actionable learning content.
// `
//         });

//         // Build chat history for context (exclude the message we just saved)
//         const history = await Message.find({ userId: SHARED_USER_ID })
//           .sort({ createdAt: 1 })
//           .limit(20);

//         // Gemini requires history to start with 'user' and alternate roles
//         const chatHistory = [];
//         for (const m of history.slice(0, -1)) { // exclude last (current user msg)
//           chatHistory.push({
//             role: m.role === 'assistant' ? 'model' : 'user',
//             parts: [{ text: m.content }]
//           });
//         }

//         const chat = model.startChat({ history: chatHistory });
//         const learningInstruction = buildLearningInstruction(learningContext);
//         const finalPrompt = learningInstruction
//           ? `${learningInstruction}\n\nUser message:\n${message}`
//           : message;
//         const result = await chat.sendMessage(finalPrompt);
//         aiResponse = result.response.text();
//       } catch (geminiErr) {
//         console.error('Gemini unavailable, using fallback response:', geminiErr.message);
//         aiResponse = getMockResponse(message);
//       }
//     } else {
//       aiResponse = getMockResponse(message);
//     }

//     await Message.create({ userId: SHARED_USER_ID, role: 'assistant', content: aiResponse });
//     res.json({ response: aiResponse });
//   } catch (err) {
//     console.error('Gemini error:', err.message);
//     res.status(500).json({ message: err.message });
//   }
// });

// router.get('/history', async (req, res) => {
//   try {
//     const messages = await Message.find({ userId: SHARED_USER_ID }).sort({ createdAt: 1 });
//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// router.delete('/history', async (req, res) => {
//   try {
//     await Message.deleteMany({ userId: SHARED_USER_ID });
//     res.json({ message: 'Chat history cleared' });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// module.exports = router;
