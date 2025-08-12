import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..'))); // Serve static files from parent directory

// Initialize OpenAI
let openai = null;
try {
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✅ OpenAI initialized successfully');
  } else {
    console.log('⚠️ OpenAI API key not configured - AI features will be disabled');
  }
} catch (error) {
  console.error('❌ Failed to initialize OpenAI:', error.message);
}

// Initialize Supabase
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    console.log('✅ Supabase initialized successfully');
  } else {
    console.log('⚠️ Supabase not configured - using in-memory storage');
  }
} catch (error) {
  console.error('❌ Failed to initialize Supabase:', error.message);
}

// In-memory storage fallback
const conversations = new Map();

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

// Routes
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: path.join(__dirname, '..') });
});

app.get('/dashboard', (req, res) => {
  res.sendFile('dashboard.html', { root: path.join(__dirname, '..') });
});

// Start conversation endpoint
app.post('/start', async (req, res) => {
  try {
    const conversationId = generateConversationId();
    
    console.log(`🆕 Creating new conversation: ${conversationId}`);

    if (supabase) {
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
    } else {
      // Use in-memory storage
      conversations.set(conversationId, []);
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
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    if (!message || !sessionId) {
      return res.status(400).json(createErrorResponse('Missing message or sessionId'));
    }

    if (!openai) {
      // Return fallback response instead of error when OpenAI is not configured
      const fallbackResponses = [
        "Xin chào! Tôi là NiO Assistant. Hiện tại tôi đang ở chế độ demo. Bạn có thể hỏi tôi bất cứ điều gì và tôi sẽ cố gắng trả lời hữu ích nhất có thể.",
        "Cảm ơn bạn đã liên hệ! Tôi là trợ lý AI của NiO. Hiện tại tôi đang trong chế độ demo, nhưng tôi vẫn có thể giúp bạn với các câu hỏi cơ bản.",
        "Chào bạn! Tôi là NiO Assistant. Mặc dù tôi đang ở chế độ demo, tôi vẫn có thể hỗ trợ bạn. Bạn cần gì không?",
        "Xin chào! Tôi là trợ lý AI của NiO. Hiện tại tôi đang được cấu hình, nhưng tôi vẫn có thể trò chuyện với bạn. Bạn muốn hỏi gì không?",
        "Cảm ơn bạn đã sử dụng NiO Assistant! Tôi đang trong chế độ demo và sẵn sàng hỗ trợ bạn với các câu hỏi."
      ];
      
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      console.log(`💬 Processing message for session: ${sessionId} (fallback mode)`);

      // Save conversation even with fallback response
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

      // Add user message and fallback response to history
      conversationHistory.push({ role: 'user', content: message });
      conversationHistory.push({ role: 'assistant', content: randomResponse });

      // Save updated conversation
      if (supabase) {
        const { error } = await supabase
          .from('conversations')
          .update({
            messages: conversationHistory
          })
          .eq('conversation_id', sessionId);

        if (error) {
          console.error('❌ Supabase save error:', error);
        }
      } else {
        conversations.set(sessionId, conversationHistory);
      }

      return res.status(200).json({ response: randomResponse });
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

    // Add user message to history
    conversationHistory.push({ role: 'user', content: message });

    // Get AI response
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

    // Save updated conversation
    if (supabase) {
      const { error } = await supabase
        .from('conversations')
        .update({
          messages: conversationHistory
        })
        .eq('conversation_id', sessionId);

      if (error) {
        console.error('❌ Supabase save error:', error);
      }
    } else {
      conversations.set(sessionId, conversationHistory);
    }

    res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json(createErrorResponse('Failed to process message'));
  }
});

// Get conversations list
app.get('/api/conversations', async (req, res) => {
  try {
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
      // Use in-memory storage
      const formattedConversations = Array.from(conversations.entries()).map(([id, messages]) => ({
        id,
        createdAt: new Date().toISOString(),
        messageCount: messages.length,
        lastMessage: messages.length > 0 ? messages[messages.length - 1].content : 'No messages'
      }));

      res.status(200).json(formattedConversations);
    }

  } catch (error) {
    console.error('❌ Get conversations error:', error);
    res.status(500).json(createErrorResponse('Failed to get conversations'));
  }
});

// Get specific conversation
app.get('/api/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;

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
      const messages = conversations.get(id);
      if (!messages) {
        return res.status(404).json(createErrorResponse('Conversation not found'));
      }

      res.status(200).json({
        conversation_id: id,
        messages: messages,
        created_at: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Get conversation error:', error);
    res.status(500).json(createErrorResponse('Failed to get conversation'));
  }
});

// Delete conversation
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (supabase) {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('conversation_id', id);

      if (error) {
        console.error('❌ Supabase delete error:', error);
        return res.status(500).json(createErrorResponse('Failed to delete conversation'));
      }
    } else {
      conversations.delete(id);
    }

    res.status(200).json({ message: 'Conversation deleted successfully' });

  } catch (error) {
    console.error('❌ Delete conversation error:', error);
    res.status(500).json(createErrorResponse('Failed to delete conversation'));
  }
});

// Analyze conversation
app.post('/api/conversations/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;

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
    } else {
      messages = conversations.get(id) || [];
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

  } catch (error) {
    console.error('❌ Analyze conversation error:', error);
    res.status(500).json(createErrorResponse('Failed to analyze conversation'));
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    openai: openai ? 'Configured' : 'Not configured',
    supabase: supabase ? 'Connected' : 'Not connected'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`🔧 Health check: http://localhost:${PORT}/api/health`);
  
  if (!process.env.OPENAI_API_KEY) {
    console.log(`\n⚠️  WARNING: Please set your OpenAI API key in the .env file!`);
  }
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.log(`\n⚠️  WARNING: Please set your Supabase credentials in the .env file!`);
  }
});