import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

console.log("🚀 Starting Time Warp Online Call...");

// DeepSeek Configuration
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com"
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: "✅ Healthy",
    app: "Time Warp Online Call",
    ai: "DeepSeek"
  });
});

// AI Chat Endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",           // DeepSeek's best model
      messages: [
        { 
          role: "system", 
          content: "You are a professional, friendly AI assistant for Time Warp Online Call - an AI-powered cloud phone system." 
        },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    res.json({
      reply: completion.choices[0].message.content,
      success: true,
      provider: "deepseek"
    });
  } catch (error) {
    console.error("DeepSeek Error:", error.message);
    res.status(500).json({ 
      error: "AI service error",
      message: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Time Warp Online Call is running on port ${port} (DeepSeek)`);
});
