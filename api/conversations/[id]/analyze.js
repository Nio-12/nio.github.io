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

  const { id } = req.query;

  if (!id) {
    return res.status(400).json(createErrorResponse('Missing conversation ID'));
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json(createErrorResponse('OpenAI API key not configured'));
  }

  if (!supabase) {
    return res.status(500).json(createErrorResponse('Supabase not configured'));
  }

  try {
    // Get conversation
    const { data } = await supabase
      .from('conversations')
      .select('messages')
      .eq('conversation_id', id)
      .single();

    if (!data) {
      return res.status(404).json(createErrorResponse('Conversation not found'));
    }

    const messages = data.messages || [];

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

    res.status(200).json({ analysis });

  } catch (error) {
    console.error('❌ Analyze error:', error);
    res.status(500).json(createErrorResponse('Failed to analyze conversation'));
  }
}
