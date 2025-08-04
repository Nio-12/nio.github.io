import dotenv from 'dotenv';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase:', error.message);
}

// Utility functions
const createErrorResponse = (message, status = 500) => ({
  error: message,
  timestamp: new Date().toISOString()
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json(createErrorResponse('Method not allowed'));
  }

  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json(createErrorResponse('Missing message or sessionId'));
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json(createErrorResponse('OpenAI API key not configured'));
    }

    console.log(`💬 Processing message for session: ${sessionId}`);

    // Get conversation history
    let conversationHistory = [];
    if (supabase) {
      const { data } = await supabase
        .from('conversations')
        .select('messages')
        .eq('conversation_id', sessionId)
        .single();
      
      if (data) {
        conversationHistory = data.messages || [];
      }
    }

    // Add user message
    conversationHistory.push({ role: 'user', content: message });

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are NiO, a helpful AI assistant. You help customers with their questions and provide excellent service. Always respond in Vietnamese unless the customer asks in English.`
        },
        ...conversationHistory
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0].message.content;

    // Add AI response to history
    conversationHistory.push({ role: 'assistant', content: aiResponse });

    // Save to database
    if (supabase) {
      const { error } = await supabase
        .from('conversations')
        .upsert({
          conversation_id: sessionId,
          messages: conversationHistory,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Supabase save error:', error);
      }
    }

    res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json(createErrorResponse('Failed to process message'));
  }
} 