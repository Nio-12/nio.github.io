import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    console.log('✅ Supabase initialized successfully');
  } else {
    console.log('⚠️ Supabase not configured - using in-memory storage only');
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase:', error.message);
}

// In-memory storage fallback
const conversations = new Map();

// Utility functions
const generateSessionId = () => Math.random().toString(36).substr(2, 9);

const createErrorResponse = (message, status = 500) => ({
  error: message,
  timestamp: new Date().toISOString()
});

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    openai: process.env.OPENAI_API_KEY ? 'Configured' : 'Not configured',
    supabase: supabase ? 'Connected' : 'Not connected'
  });
});

// Test OpenAI connection
app.get('/api/test-openai', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(400).json({ error: 'OpenAI API key not configured' });
    }

    const models = await openai.models.list();
    res.json({ 
      success: true, 
      message: 'OpenAI connection successful',
      models: models.data.length
    });
  } catch (error) {
    console.error('OpenAI test error:', error);
    res.status(500).json({ 
      error: 'OpenAI connection failed', 
      details: error.message 
    });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
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
    } else {
      conversationHistory = conversations.get(sessionId) || [];
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

    // Save to database or memory
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
    } else {
      conversations.set(sessionId, conversationHistory);
    }

    res.json({ response: aiResponse });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json(createErrorResponse('Failed to process message'));
  }
});

// Get conversations for dashboard
app.get('/api/conversations', async (req, res) => {
  try {
    if (!supabase) {
      const inMemoryConversations = Array.from(conversations.entries()).map(([sessionId, conv]) => {
        const userMessages = conv.filter(msg => msg.role === 'user');
        const lastUserMessage = userMessages[userMessages.length - 1];
        const preview = lastUserMessage 
          ? lastUserMessage.content.substring(0, 100) + (lastUserMessage.content.length > 100 ? '...' : '') 
          : 'No messages';
        
        return {
          id: sessionId,
          preview,
          messageCount: conv.length - 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          analysis: null
        };
      });
      
      return res.json({ conversations: inMemoryConversations });
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

    res.json({ conversations: processedConversations });

  } catch (error) {
    console.error('❌ Get conversations error:', error);
    res.status(500).json(createErrorResponse('Failed to load conversations'));
  }
});

// Get conversation details
app.get('/api/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      const conversation = conversations.get(id);
      if (!conversation) {
        return res.status(404).json(createErrorResponse('Conversation not found'));
      }
      return res.json({
        conversationId: id,
        messages: conversation
      });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('messages')
      .eq('conversation_id', id)
      .single();

    if (error || !data) {
      return res.status(404).json(createErrorResponse('Conversation not found'));
    }

    res.json({
      conversationId: id,
      messages: data.messages || []
    });

  } catch (error) {
    console.error('❌ Get conversation error:', error);
    res.status(500).json(createErrorResponse('Failed to load conversation'));
  }
});

// Delete conversation
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!supabase) {
      conversations.delete(id);
      return res.json({ success: true });
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('conversation_id', id);

    if (error) {
      console.error('❌ Delete error:', error);
      return res.status(500).json(createErrorResponse('Failed to delete conversation'));
    }

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Delete conversation error:', error);
    res.status(500).json(createErrorResponse('Failed to delete conversation'));
  }
});

// Analyze conversation
app.post('/api/conversations/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json(createErrorResponse('OpenAI API key not configured'));
    }

    // Get conversation
    let messages = [];
    if (supabase) {
      const { data } = await supabase
        .from('conversations')
        .select('messages')
        .eq('conversation_id', id)
        .single();

      if (!data) {
        return res.status(404).json(createErrorResponse('Conversation not found'));
      }
      messages = data.messages || [];
    } else {
      messages = conversations.get(id) || [];
    }

    if (messages.length === 0) {
      return res.status(400).json(createErrorResponse('No messages to analyze'));
    }

    // Create analysis prompt
    const conversationText = messages
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .join('\n');

    const analysisPrompt = `
Analyze this customer conversation and extract the following information in JSON format:

Customer Information:
- customerName: Full name if mentioned
- customerEmail: Email address if mentioned  
- customerPhone: Phone number if mentioned
- customerIndustry: Industry/business type if mentioned

Business Details:
- customerProblem: Main problems or needs mentioned
- customerAvailability: Availability for consultation if mentioned
- customerConsultation: Boolean - whether they want consultation

Lead Assessment:
- leadQuality: "good", "ok", or "spam" based on seriousness
- specialNotes: Any important notes or observations

Conversation: ${conversationText}

Return only valid JSON without any additional text.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a customer analysis expert. Extract customer information from conversations and return only valid JSON.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    const analysisText = completion.choices[0].message.content;
    let analysis;

    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      analysis = {
        customerName: null,
        customerEmail: null,
        customerPhone: null,
        customerIndustry: null,
        customerProblem: null,
        customerAvailability: null,
        customerConsultation: false,
        leadQuality: 'ok',
        specialNotes: 'Analysis failed - could not parse response'
      };
    }

    // Save analysis to database
    if (supabase) {
      const { error } = await supabase
        .from('conversations')
        .update({
          customerName: analysis.customerName,
          customerEmail: analysis.customerEmail,
          customerPhone: analysis.customerPhone,
          customerIndustry: analysis.customerIndustry,
          customerProblem: analysis.customerProblem,
          customerAvailability: analysis.customerAvailability,
          customerConsultation: analysis.customerConsultation,
          leadQuality: analysis.leadQuality,
          specialNotes: analysis.specialNotes
        })
        .eq('conversation_id', id);

      if (error) {
        console.error('❌ Save analysis error:', error);
      }
    }

    res.json({ analysis });

  } catch (error) {
    console.error('❌ Analyze error:', error);
    res.status(500).json(createErrorResponse('Failed to analyze conversation'));
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints:`);
  console.log(`   POST /api/chat - Send a message`);
  console.log(`   GET /api/conversations - Get all conversations`);
  console.log(`   GET /api/conversations/:id - Get conversation details`);
  console.log(`   DELETE /api/conversations/:id - Delete conversation`);
  console.log(`   POST /api/conversations/:id/analyze - Analyze conversation`);
  console.log(`   GET /api/health - Health check`);
  console.log(`   GET /api/test-openai - Test OpenAI connection`);
  console.log(``);
  console.log(`🌐 Frontend available at: http://localhost:${PORT}/index.html`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.log(`\n⚠️  WARNING: Please set your OpenAI API key in the .env file!`);
  }
}); 