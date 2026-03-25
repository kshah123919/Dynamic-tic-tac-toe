import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ FIX ADDED (for "Cannot GET /")
app.get('/', (req, res) => {
  res.send("🚀 Backend is running!");
});

// Initialize Gemini
const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("❌ GEMINI_API_KEY not found in .env");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * API Endpoint: Suggest Move
 * Returns a strategic move suggestion based on board rotation rules.
 */
app.post('/api/suggest', async (req, res) => {
  const { board, player } = req.body;

  try {
    // Model as requested: gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      We are playing Dynamic Tic Tac Toe on a 3x3 grid. 
      Rules: After every move, the board rotates randomly (90° CW, 90° CCW, or 180°).
      Current Board State: ${JSON.stringify(board)}
      Current Player: ${player}

      Task: Suggest the best next move for ${player} in a short sentence.
      Requirement: Explain why briefly (max 20 words), considering that the piece will move after rotation.
      Format: Return just the answer.
    `;

    const result = await model.generateContent(prompt);
    const text = (await result.response).text();

    res.json({ suggestion: text });
  } catch (error) {
    console.error("Gemini API Suggest Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * (Optional but useful) API Endpoint: Explain Result
 */
app.post('/api/explain', async (req, res) => {
  const { board, result: gameResult } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `
      The game of Dynamic Tic Tac Toe just ended.
      Winner: ${gameResult}
      Final Board: ${JSON.stringify(board)}
      
      Briefly explain why this happened in simple terms (max 25 words).
    `;

    const result = await model.generateContent(prompt);
    res.json({ explanation: (await result.response).text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`-----------------------------------------`);
  console.log(`🚀 Gemini Backend Server Running!`);
  console.log(`🔗 Local: http://localhost:${port}`);
  console.log(`-----------------------------------------`);
});