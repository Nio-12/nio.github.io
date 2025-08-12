import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Initialize OpenAI
let openai = null;
try {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
} catch (error) {
  console.error('❌ Failed to initialize OpenAI:', error.message);
}

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

  try {
    if (method === 'GET') {
      // Get conversations list
      if (supabase) {
        const { data, error } = await supabase
          .from('conversations')
          .select('conversation_id, created_at, messages')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Supabase fetch error:', error);
          return res.status(500).json(createErrorResponse('Failed to fetch conversations'));
        }

        // Format conversations for frontend
        const formattedConversations = data.map(conv => ({
          id: conv.conversation_id,
          createdAt: conv.created_at,
          messageCount: conv.messages ? conv.messages.length : 0,
          lastMessage: conv.messages && conv.messages.length > 0 
            ? conv.messages[conv.messages.length - 1].content 
            : 'No messages'
        }));

        res.status(200).json(formattedConversations);
      } else {
        res.status(200).json([]);
      }
    } else if (method === 'DELETE') {
      // Delete conversation
      const { id } = req.query;

      if (!id) {
        return res.status(400).json(createErrorResponse('Missing conversation ID'));
      }

      if (supabase) {
        const { error } = await supabase
          .from('conversations')
          .delete()
          .eq('conversation_id', id);

        if (error) {
          console.error('❌ Supabase delete error:', error);
          return res.status(500).json(createErrorResponse('Failed to delete conversation'));
        }
      }

      res.status(200).json({ message: 'Conversation deleted successfully' });
    } else if (method === 'POST') {
      // Analyze conversation
      const { id } = req.query;

      if (!id) {
        return res.status(400).json(createErrorResponse('Missing conversation ID'));
      }

      if (!openai) {
        return res.status(500).json(createErrorResponse('OpenAI not configured'));
      }

      // Get conversation
      let messages = [];
      if (supabase) {
        const { data: conversation, error: fetchError } = await supabase
          .from('conversations')
          .select('messages')
          .eq('conversation_id', id)
          .single();

        if (fetchError) {
          console.error('❌ Supabase fetch error:', fetchError);
          return res.status(404).json(createErrorResponse('Conversation not found'));
        }

        messages = conversation.messages || [];
      }

      if (messages.length === 0) {
        return res.status(400).json(createErrorResponse('No messages to analyze'));
      }

      // Analyze with OpenAI
      const analysisPrompt = `Analyze this conversation and provide insights:
      - Overall sentiment
      - Key topics discussed
      - User satisfaction level
      - Suggestions for improvement
      
      Conversation: ${JSON.stringify(messages)}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a conversation analyst. Provide clear, concise analysis in Vietnamese.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const analysis = completion.choices[0].message.content;

      res.status(200).json({ analysis });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('❌ Conversations error:', error);
    res.status(500).json(createErrorResponse('Failed to process request'));
  }
}
