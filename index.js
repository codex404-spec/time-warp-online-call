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

// === DeepSeek Setup ===
if (!process.env.DEEPSEEK_API_KEY) {
  console.error("❌ FATAL: DEEPSEEK_API_KEY is missing in Railway Variables!");
} else {
  console.log("✅ DeepSeek API key loaded successfully");
}

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com"
});

// ====================== ROUTES ======================

// Homepage
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Time Warp Online Call</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #0f172a; color: white; }
        h1 { color: #22d3ee; }
        .card { background: #1e2937; padding: 20px; border-radius: 12px; max-width: 600px; margin: 20px auto; }
      </style>
    </head>
    <body>
      <h1>🚀 Time Warp Online Call</h1>
      <p><strong>AI-Powered Cloud Phone System</strong></p>
      
      <div class="card">
        <h2>✅ System Status: Online</h2>
        <p>Backend is running successfully on Railway</p>
      </div>

      <div class="card">
        <h3>Available Endpoints</h3>
        <ul style="text-align: left; display: inline-block;">
          <li><strong>GET /health</strong> - Check system health</li>
          <li><strong>POST /api/chat</strong> - Talk to AI Agent</li>
        </ul>
      </div>

      <p>Made for automated dialing & omnichannel messaging</p>
    </body>
    </html>
  `);
});

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: "✅ Healthy",
    app: "Time Warp Online Call",
    ai: process.env.DEEPSEEK_API_KEY ? "DeepSeek Connected" : "Key Missing",
    time: new Date().toISOString()
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
      model: "deepseek-chat",
      messages: [
        { 
          role: "system", 
          content: "You are a professional, friendly AI assistant for Time Warp Online Call - an AI-powered cloud phone and messaging system. Help users with sales, support, bookings, and automated communication." 
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

// Start Server
app.listen(port, () => {
  console.log(`✅ Time Warp Online Call is running on port ${port}`);
  console.log(`🌐 Public URL: https://time-warp-online-call-copy-production.up.railway.app`);
});
