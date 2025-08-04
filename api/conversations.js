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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json(createErrorResponse('Method not allowed'));
  }

  try {
    if (!supabase) {
      return res.status(500).json(createErrorResponse('Supabase not configured'));
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('conversation_id, messages, created_at, customerName, customerEmail, customerPhone, customerIndustry, customerProblem, customerAvailability, customerConsultation, specialNotes, leadQuality')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json(createErrorResponse('Database error'));
    }

    const processedConversations = (data || []).map(conv => {
      const messages = conv.messages || [];
      const userMessages = messages.filter(msg => msg.role === 'user');
      const lastUserMessage = userMessages[userMessages.length - 1];
      const preview = lastUserMessage 
        ? lastUserMessage.content.substring(0, 100) + (lastUserMessage.content.length > 100 ? '...' : '') 
        : 'No messages';

      return {
        id: conv.conversation_id,
        preview,
        messageCount: messages.length - 1,
        createdAt: conv.created_at,
        updatedAt: conv.created_at,
        analysis: {
          customerName: conv.customerName,
          customerEmail: conv.customerEmail,
          customerPhone: conv.customerPhone,
          customerIndustry: conv.customerIndustry,
          customerProblem: conv.customerProblem,
          customerAvailability: conv.customerAvailability,
          customerConsultation: conv.customerConsultation,
          specialNotes: conv.specialNotes,
          leadQuality: conv.leadQuality
        }
      };
    });

    res.status(200).json({ conversations: processedConversations });

  } catch (error) {
    console.error('❌ Get conversations error:', error);
    res.status(500).json(createErrorResponse('Failed to load conversations'));
  }
} 