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
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json(createErrorResponse('Missing conversation ID'));
  }

  if (!supabase) {
    return res.status(500).json(createErrorResponse('Supabase not configured'));
  }

  try {
    // GET - Get conversation details
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('conversations')
        .select('messages')
        .eq('conversation_id', id)
        .single();

      if (error || !data) {
        return res.status(404).json(createErrorResponse('Conversation not found'));
      }

      res.status(200).json({
        conversationId: id,
        messages: data.messages || []
      });
    }
    // DELETE - Delete conversation
    else if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('conversation_id', id);

      if (error) {
        console.error('❌ Delete error:', error);
        return res.status(500).json(createErrorResponse('Failed to delete conversation'));
      }

      res.status(200).json({ success: true });
    }
    // Method not allowed
    else {
      return res.status(405).json(createErrorResponse('Method not allowed'));
    }

  } catch (error) {
    console.error('❌ Conversation operation error:', error);
    res.status(500).json(createErrorResponse('Failed to process request'));
  }
} 