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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    }

    res.status(200).json({ response: aiResponse });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json(createErrorResponse('Failed to process message'));
  }
}
