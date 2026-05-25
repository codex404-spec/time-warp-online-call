import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

console.log("🚀 Starting Time Warp Online Call...");

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com"
});

// Main Call Website
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: "✅ Healthy", app: "Time Warp Online Call" });
});

// AI Text Chat (used by voice system)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { 
          role: "system", 
          content: "You are a friendly, professional AI voice assistant. Keep responses natural, concise, and conversational. Help with sales, support, bookings, or general conversation." 
        },
        ...conversationHistory,
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 600
    });

    res.json({ 
      reply: completion.choices[0].message.content,
      success: true 
    });
  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ error: "Failed to get AI response" });
  }
});

app.listen(port, () => {
  console.log(`✅ Time Warp Online Call is LIVE on port ${port}`);
});
