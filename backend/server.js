import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const conversations = {}; // { sessionId: [ {role, content}, ... ] }

app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message || !sessionId) return res.status(400).json({ error: 'Missing message or sessionId' });

  if (!conversations[sessionId]) {
    conversations[sessionId] = [
      { role: 'system', content: 'You are a helpful, friendly, and professional AI assistant. Provide clear, concise, and helpful responses. Keep responses conversational and engaging.' }
    ];
  }
  conversations[sessionId].push({ role: 'user', content: message });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: conversations[sessionId],
      max_tokens: 500,
      temperature: 0.7
    });
    const botMessage = completion.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not process your request.';
    conversations[sessionId].push({ role: 'assistant', content: botMessage });
    res.json({ response: botMessage });
  } catch (err) {
    console.error('OpenAI error:', err.response?.data || err.message || err);
    res.status(500).json({ error: 'Failed to connect to OpenAI' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 