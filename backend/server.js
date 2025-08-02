import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://yourusername.github.io',
        'https://*.github.io',
        'https://nio-chatbot-backend.vercel.app',
        'https://*.vercel.app'
      ] 
    : ['http://localhost:3000', 'http://127.0.0.1:5500', 'http://localhost:5500'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase with error handling
let supabase = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    console.log('✅ Supabase initialized successfully');
  } else {
    console.log('⚠️ Supabase not configured - using in-memory storage only');
    console.log('Please set SUPABASE_URL and SUPABASE_KEY in your .env file');
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

const validateSessionId = (sessionId) => {
  return sessionId && typeof sessionId === 'string' && sessionId.length > 0;
};

const validateMessage = (message) => {
  return message && typeof message === 'string' && message.trim().length > 0;
};

// Webhook configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Function to send conversation data to webhook
const sendToWebhook = async (conversationData) => {
  if (!WEBHOOK_URL) {
    console.log('⚠️ No webhook URL configured - skipping webhook call');
    return null;
  }

  try {
    console.log('🌐 Sending conversation data to webhook...');
    const response = await axios.post(WEBHOOK_URL, conversationData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NiO-Chatbot/1.0'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ Webhook response received:', response.status);
    return response.data;
  } catch (error) {
    console.error('❌ Webhook error:', error.response?.data || error.message);
    return null;
  }
};

// API Routes

// Get all conversations for dashboard
app.get('/api/conversations', async (req, res) => {
  try {
    if (!supabase) {
      console.log('📝 Returning in-memory conversations');
      const inMemoryConversations = Array.from(conversations.entries()).map(([sessionId, conv]) => {
        const userMessages = conv.filter(msg => msg.role === 'user');
        const lastUserMessage = userMessages[userMessages.length - 1];
        const preview = lastUserMessage 
          ? lastUserMessage.content.substring(0, 100) + (lastUserMessage.content.length > 100 ? '...' : '') 
          : 'No messages';
        
        return {
          id: sessionId,
          preview,
          messageCount: conv.length - 1, // Exclude system message
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          analysis: null
        };
      });
      
      return res.json({ conversations: inMemoryConversations });
    }

    console.log('📊 Fetching conversations from Supabase...');
    const { data, error } = await supabase
      .from('conversations')
      .select('conversation_id, messages, created_at, customerName, customerEmail, customerPhone, customerIndustry, customerProblem, customerAvailability, customerConsultation, specialNotes, leadQuality')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error:', error);
      return res.status(500).json(createErrorResponse('Database error'));
    }

    console.log(`📈 Found ${data?.length || 0} conversations`);

    const processedConversations = (data || []).map(conv => {
      const userMessages = conv.messages?.filter(msg => msg.role === 'user') || [];
      const lastUserMessage = userMessages[userMessages.length - 1];
      const preview = lastUserMessage 
        ? lastUserMessage.content.substring(0, 100) + (lastUserMessage.content.length > 100 ? '...' : '') 
        : 'No messages';
      
      return {
        id: conv.conversation_id,
        preview,
        messageCount: (conv.messages?.length || 1) - 1, // Exclude system message
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
  } catch (err) {
    console.error('❌ Error fetching conversations:', err);
    res.status(500).json(createErrorResponse('Failed to fetch conversations'));
  }
});

// Get specific conversation messages
app.get('/api/conversations/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  
  if (!validateSessionId(conversationId)) {
    return res.status(400).json(createErrorResponse('Invalid conversation ID'));
  }

  try {
    if (!supabase) {
      const conv = conversations.get(conversationId);
      if (!conv) {
        return res.status(404).json(createErrorResponse('Conversation not found'));
      }
      
      const displayMessages = conv.filter(msg => msg.role !== 'system');
      return res.json({
        conversationId,
        messages: displayMessages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        analysis: null
      });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('messages, created_at, customerName, customerEmail, customerPhone, customerIndustry, customerProblem, customerAvailability, customerConsultation, specialNotes, leadQuality')
      .eq('conversation_id', conversationId)
      .single();

    if (error || !data) {
      console.error('❌ Supabase error:', error);
      return res.status(404).json(createErrorResponse('Conversation not found'));
    }

    const displayMessages = data.messages?.filter(msg => msg.role !== 'system') || [];
    
    res.json({
      conversationId,
      messages: displayMessages,
      createdAt: data.created_at,
      updatedAt: data.created_at,
      analysis: {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        customerIndustry: data.customerIndustry,
        customerProblem: data.customerProblem,
        customerAvailability: data.customerAvailability,
        customerConsultation: data.customerConsultation,
        specialNotes: data.specialNotes,
        leadQuality: data.leadQuality
      }
    });
  } catch (err) {
    console.error('❌ Error fetching conversation:', err);
    res.status(500).json(createErrorResponse('Failed to fetch conversation'));
  }
});

// Delete conversation
app.delete('/api/conversations/:conversationId', async (req, res) => {
  const { conversationId } = req.params;
  
  if (!validateSessionId(conversationId)) {
    return res.status(400).json(createErrorResponse('Invalid conversation ID'));
  }

  try {
    if (!supabase) {
      const deleted = conversations.delete(conversationId);
      if (!deleted) {
        return res.status(404).json(createErrorResponse('Conversation not found'));
      }
      return res.json({ success: true, message: 'Conversation deleted successfully' });
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('conversation_id', conversationId);
    
    if (error) {
      console.error('❌ Supabase delete error:', error);
      return res.status(500).json(createErrorResponse('Failed to delete conversation'));
    }
    
    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting conversation:', err);
    res.status(500).json(createErrorResponse('Failed to delete conversation'));
  }
});

// Analyze conversation for customer information and lead quality
app.post('/api/conversations/:conversationId/analyze', async (req, res) => {
  const { conversationId } = req.params;
  
  if (!validateSessionId(conversationId)) {
    return res.status(400).json(createErrorResponse('Invalid conversation ID'));
  }

  try {
    let messages;
    
    if (!supabase) {
      messages = conversations.get(conversationId)?.messages;
      if (!messages) {
        return res.status(404).json(createErrorResponse('Conversation not found'));
      }
    } else {
      const { data, error } = await supabase
        .from('conversations')
        .select('messages, created_at')
        .eq('conversation_id', conversationId)
        .single();

      if (error || !data) {
        console.error('❌ Supabase error:', error);
        return res.status(404).json(createErrorResponse('Conversation not found'));
      }
      
      messages = data.messages;
    }

    // Filter out system messages and create conversation transcript
    const userMessages = messages.filter(msg => msg.role === 'user');
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    
    let transcript = '';
    for (let i = 0; i < Math.max(userMessages.length, assistantMessages.length); i++) {
      if (userMessages[i]) {
        transcript += `User: ${userMessages[i].content}\n`;
      }
      if (assistantMessages[i]) {
        transcript += `Assistant: ${assistantMessages[i].content}\n`;
      }
    }

    // System prompt for analysis
    const systemPrompt = `Extract the following customer details from the transcript:
- Name
- Email address
- Phone number
- Industry
- Problems, needs, and goals summary
- Availability
- Whether they have booked a consultation (true/false)
- Any special notes
- Lead quality (categorize as 'good', 'ok', or 'spam')

Format the response using this JSON schema:
{
  "type": "object",
  "properties": {
    "customerName": { "type": "string" },
    "customerEmail": { "type": "string" },
    "customerPhone": { "type": "string" },
    "customerIndustry": { "type": "string" },
    "customerProblem": { "type": "string" },
    "customerAvailability": { "type": "string" },
    "customerConsultation": { "type": "boolean" },
    "specialNotes": { "type": "string" },
    "leadQuality": { "type": "string", "enum": ["good", "ok", "spam"] }
  },
  "required": ["customerName", "customerEmail", "customerProblem", "leadQuality"]
}

IMPORTANT: 
- If the user provided contact details, set lead quality to "good"; otherwise, "spam".
- Return ONLY the JSON object, no additional text or explanations.
- Use English for all field values regardless of the conversation language.

Analyze this conversation transcript and return only the JSON object:`;

    // Call OpenAI for analysis
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript }
      ],
      max_tokens: 1000,
      temperature: 0.1
    });

    const analysisText = completion.choices?.[0]?.message?.content?.trim() || '';
    
    // Try to parse JSON from the response
    let analysis;
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = JSON.parse(analysisText);
      }
    } catch (parseError) {
      console.error('❌ Failed to parse analysis JSON:', parseError);
      return res.status(500).json(createErrorResponse('Failed to parse analysis response'));
    }

    // Save analysis to database
    if (supabase) {
      try {
        await supabase
          .from('conversations')
          .update({
            customerName: analysis.customerName,
            customerEmail: analysis.customerEmail,
            customerPhone: analysis.customerPhone,
            customerIndustry: analysis.customerIndustry,
            customerProblem: analysis.customerProblem,
            customerAvailability: analysis.customerAvailability,
            customerConsultation: analysis.customerConsultation,
            specialNotes: analysis.specialNotes,
            leadQuality: analysis.leadQuality
          })
          .eq('conversation_id', conversationId);
      } catch (err) {
        console.error('❌ Supabase save analysis error:', err);
      }
    }

    // Send conversation data to webhook
    const webhookData = {
      conversationId,
      analysis,
      transcript,
      timestamp: new Date().toISOString(),
      messageCount: messages.length,
      userMessageCount: userMessages.length,
      assistantMessageCount: assistantMessages.length
    };

    const webhookResponse = await sendToWebhook(webhookData);

    // If webhook returned additional data, update Supabase
    if (webhookResponse && supabase) {
      try {
        const updateData = {};
        
        // Update with webhook response data if provided
        if (webhookResponse.customerName) updateData.customerName = webhookResponse.customerName;
        if (webhookResponse.customerEmail) updateData.customerEmail = webhookResponse.customerEmail;
        if (webhookResponse.customerPhone) updateData.customerPhone = webhookResponse.customerPhone;
        if (webhookResponse.customerIndustry) updateData.customerIndustry = webhookResponse.customerIndustry;
        if (webhookResponse.customerProblem) updateData.customerProblem = webhookResponse.customerProblem;
        if (webhookResponse.customerAvailability) updateData.customerAvailability = webhookResponse.customerAvailability;
        if (webhookResponse.customerConsultation !== undefined) updateData.customerConsultation = webhookResponse.customerConsultation;
        if (webhookResponse.specialNotes) updateData.specialNotes = webhookResponse.specialNotes;
        if (webhookResponse.leadQuality) updateData.leadQuality = webhookResponse.leadQuality;
        
        // Add webhook-specific fields
        if (webhookResponse.webhookNotes) updateData.webhookNotes = webhookResponse.webhookNotes;
        if (webhookResponse.webhookStatus) updateData.webhookStatus = webhookResponse.webhookStatus;
        if (webhookResponse.webhookProcessed) updateData.webhookProcessed = webhookResponse.webhookProcessed;

        if (Object.keys(updateData).length > 0) {
          await supabase
            .from('conversations')
            .update(updateData)
            .eq('conversation_id', conversationId);
          console.log('✅ Updated conversation with webhook data');
        }
      } catch (err) {
        console.error('❌ Supabase webhook update error:', err);
      }
    }

    res.json({ 
      analysis,
      webhookProcessed: webhookResponse !== null,
      webhookData: webhookResponse || null
    });
  } catch (err) {
    console.error('❌ Error analyzing conversation:', err);
    res.status(500).json(createErrorResponse('Failed to analyze conversation'));
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;
  
  if (!validateMessage(message) || !validateSessionId(sessionId)) {
    return res.status(400).json(createErrorResponse('Missing or invalid message or sessionId'));
  }

  try {
    // Load from Supabase if not in memory
    let conversationMessages;
    
    if (!supabase) {
      conversationMessages = conversations.get(sessionId);
    } else {
      try {
        const { data, error } = await supabase
          .from('conversations')
          .select('messages')
          .eq('conversation_id', sessionId)
          .single();
          
        if (data && data.messages) {
          conversationMessages = data.messages;
        }
      } catch (err) {
        console.error('❌ Supabase load error:', err);
      }
    }

    // Initialize conversation if not exists
    if (!conversationMessages) {
      conversationMessages = [
        {
          role: 'system',
          content: `Bạn là trợ lý Nio Trợ lý của Khánh. Bạn nói chuyện thân thiện vui vẻ như một người bạn đồng hành với tôi.`
        }
      ];
    }

    conversationMessages.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: conversationMessages,
      max_tokens: 500,
      temperature: 0.7
    });
    
    const botMessage = completion.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not process your request.';
    conversationMessages.push({ role: 'assistant', content: botMessage });

    // Save to storage
    if (supabase) {
      try {
        console.log('💾 Saving conversation to Supabase:', sessionId);
        const { error } = await supabase
          .from('conversations')
          .upsert([
            {
              conversation_id: sessionId,
              messages: conversationMessages,
            }
          ], { onConflict: ['conversation_id'] });
        
        if (error) {
          console.error('❌ Supabase save error:', error);
        } else {
          console.log('✅ Conversation saved successfully to Supabase');
        }
      } catch (err) {
        console.error('❌ Supabase save error:', err);
      }
    } else {
      conversations.set(sessionId, conversationMessages);
      console.log('💾 Conversation stored in memory only');
    }

    // Auto-analyze conversation after each chat (only if webhook is configured)
    if (WEBHOOK_URL) {
      try {
        console.log('🔍 Auto-analyzing conversation...');
        
        // Get conversation data for analysis
        const userMessages = conversationMessages.filter(msg => msg.role === 'user');
        const assistantMessages = conversationMessages.filter(msg => msg.role === 'assistant');
        
        let transcript = '';
        for (let i = 0; i < Math.max(userMessages.length, assistantMessages.length); i++) {
          if (userMessages[i]) {
            transcript += `User: ${userMessages[i].content}\n`;
          }
          if (assistantMessages[i]) {
            transcript += `Assistant: ${assistantMessages[i].content}\n`;
          }
        }

        // System prompt for analysis
        const systemPrompt = `Extract the following customer details from the transcript:
- Name
- Email address
- Phone number
- Industry
- Problems, needs, and goals summary
- Availability
- Whether they have booked a consultation (true/false)
- Any special notes
- Lead quality (categorize as 'good', 'ok', or 'spam')

Format the response using this JSON schema:
{
  "type": "object",
  "properties": {
    "customerName": { "type": "string" },
    "customerEmail": { "type": "string" },
    "customerPhone": { "type": "string" },
    "customerIndustry": { "type": "string" },
    "customerProblem": { "type": "string" },
    "customerAvailability": { "type": "string" },
    "customerConsultation": { "type": "boolean" },
    "specialNotes": { "type": "string" },
    "leadQuality": { "type": "string", "enum": ["good", "ok", "spam"] }
  },
  "required": ["customerName", "customerEmail", "customerProblem", "leadQuality"]
}

IMPORTANT: 
- If the user provided contact details, set lead quality to "good"; otherwise, "spam".
- Return ONLY the JSON object, no additional text or explanations.
- Use English for all field values regardless of the conversation language.

Analyze this conversation transcript and return only the JSON object:`;

        // Call OpenAI for analysis
        const analysisCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcript }
          ],
          max_tokens: 1000,
          temperature: 0.1
        });

        const analysisText = analysisCompletion.choices?.[0]?.message?.content?.trim() || '';
        
        // Try to parse JSON from the response
        let analysis;
        try {
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          } else {
            analysis = JSON.parse(analysisText);
          }
        } catch (parseError) {
          console.error('❌ Failed to parse auto-analysis JSON:', parseError);
          // Continue without analysis
        }

        if (analysis) {
          // Send conversation data to webhook
          const webhookData = {
            conversationId: sessionId,
            analysis,
            transcript,
            timestamp: new Date().toISOString(),
            messageCount: conversationMessages.length,
            userMessageCount: userMessages.length,
            assistantMessageCount: assistantMessages.length,
            autoAnalyzed: true
          };

          const webhookResponse = await sendToWebhook(webhookData);

          // Update Supabase with analysis and webhook data
          if (supabase) {
            try {
              const updateData = {
                customerName: analysis.customerName,
                customerEmail: analysis.customerEmail,
                customerPhone: analysis.customerPhone,
                customerIndustry: analysis.customerIndustry,
                customerProblem: analysis.customerProblem,
                customerAvailability: analysis.customerAvailability,
                customerConsultation: analysis.customerConsultation,
                specialNotes: analysis.specialNotes,
                leadQuality: analysis.leadQuality
              };
              
              // Add webhook-specific fields if provided
              if (webhookResponse) {
                if (webhookResponse.webhookNotes) updateData.webhookNotes = webhookResponse.webhookNotes;
                if (webhookResponse.webhookStatus) updateData.webhookStatus = webhookResponse.webhookStatus;
                if (webhookResponse.webhookProcessed) updateData.webhookProcessed = webhookResponse.webhookProcessed;
              }

              await supabase
                .from('conversations')
                .update(updateData)
                .eq('conversation_id', sessionId);
              
              console.log('✅ Auto-analysis completed and saved to Supabase');
            } catch (err) {
              console.error('❌ Supabase auto-analysis save error:', err);
            }
          }
        }
      } catch (err) {
        console.error('❌ Auto-analysis error:', err);
        // Don't fail the chat request if analysis fails
      }
    }

    res.json({ response: botMessage });
  } catch (err) {
    console.error('❌ OpenAI error:', err.response?.data || err.message || err);
    res.status(500).json(createErrorResponse('Failed to connect to OpenAI'));
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    supabase: supabase ? 'connected' : 'not configured'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json(createErrorResponse('Internal server error'));
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json(createErrorResponse('Endpoint not found'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
}); 