import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: "✅ Healthy",
    app: "Time Warp Online Call",
    time: new Date().toISOString()
  });
});

// Basic AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, contactId } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a friendly AI assistant for Time Warp Online Call. Help users with calls, messaging, and bookings." },
        { role: "user", content: message }
      ],
      temperature: 0.7,
    });

    res.json({
      reply: completion.choices[0].message.content,
      success: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Time Warp Online Call API running on port ${port}`);
});
