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

if (!process.env.DEEPSEEK_API_KEY) {
  console.error("❌ DEEPSEEK_API_KEY is missing in Railway Variables!");
}

// DeepSeek Setup
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

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a helpful AI assistant for Time Warp Online Call." },
        { role: "user", content: message }
      ],
    });

    res.json({ reply: completion.choices[0].message.content, success: true });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Time Warp Online Call running on port ${port}`);
});
