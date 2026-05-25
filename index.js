import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "time-warp-super-secret-key-change-in-production-2026";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory users (we'll upgrade to database later)
const users = new Map();

// ====================== MIDDLEWARE ======================
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Please login first" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// ====================== PAGES ======================
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ====================== API ROUTES ======================
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }
  
  if (users.has(email)) {
    return res.status(400).json({ error: "User already exists" });
  }

  users.set(email, { name, password, online: true });
  res.json({ success: true, message: "Account created successfully!" });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email);
  
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign({ email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
  
  res.json({ 
    success: true, 
    token, 
    name: user.name 
  });
});

app.post('/api/chat', authenticate, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com"
    });

    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { 
          role: "system", 
          content: "You are a friendly and helpful AI assistant in Time Warp Online Call platform." 
        },
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

app.get('/health', (req, res) => {
  res.json({ status: "✅ Healthy", app: "Time Warp Online Call" });
});

// Start Server
app.listen(port, () => {
  console.log(`✅ Time Warp Online Call is running on port ${port}`);
  console.log(`🌐 Visit: https://time-warp-online-call-copy-production.up.railway.app`);
});
