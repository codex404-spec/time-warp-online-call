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
app.use(express.static('public'));   // For serving frontend files

console.log("🚀 Starting Time Warp Online Call...");

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com"
});

// ====================== PAGES ======================

// Main Calling Website
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: "✅ Healthy", app: "Time Warp Online Call" });
});

// AI Chat (Text fallback)
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a helpful, friendly AI assistant in a voice call." },
        { role: "user", content: message }
      ],
      temperature: 0.7,
    });

    res.json({ reply: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ====================== START SERVER ======================
app.listen(port, () => {
  console.log(`✅ Time Warp Online Call is LIVE on port ${port}`);
});
