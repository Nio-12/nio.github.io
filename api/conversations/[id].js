import { createClient } from '@supabase/supabase-js';

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
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method } = req;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json(createErrorResponse('Missing conversation ID'));
  }

  try {
    if (method === 'GET') {
      // Get specific conversation
      if (supabase) {
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
          .eq('conversation_id', id)
          .single();

        if (error) {
          console.error('❌ Supabase fetch error:', error);
          return res.status(404).json(createErrorResponse('Conversation not found'));
        }

        res.status(200).json(data);
      } else {
        res.status(404).json(createErrorResponse('Conversation not found'));
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('❌ Get conversation error:', error);
    res.status(500).json(createErrorResponse('Failed to get conversation'));
  }
}
