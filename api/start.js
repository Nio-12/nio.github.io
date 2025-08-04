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

// Generate unique conversation ID
const generateConversationId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
};

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
    if (!supabase) {
      return res.status(500).json(createErrorResponse('Supabase not configured'));
    }

    // Generate new conversation ID
    const conversationId = generateConversationId();
    
    console.log(`🆕 Creating new conversation: ${conversationId}`);

    // Create new conversation in database
    const { error } = await supabase
      .from('conversations')
      .insert({
        conversation_id: conversationId,
        messages: [],
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Supabase insert error:', error);
      return res.status(500).json(createErrorResponse('Failed to create conversation'));
    }

    console.log(`✅ Conversation created successfully: ${conversationId}`);

    res.status(200).json({
      conversation_id: conversationId,
      message: 'Conversation started successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Start conversation error:', error);
    res.status(500).json(createErrorResponse('Failed to start conversation'));
  }
} 