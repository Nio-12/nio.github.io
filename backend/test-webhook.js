import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const WEBHOOK_URL = process.env.WEBHOOK_URL;

if (!WEBHOOK_URL) {
  console.log('❌ No WEBHOOK_URL configured in .env file');
  console.log('Please add WEBHOOK_URL=https://your-webhook-endpoint.com/webhook to your .env file');
  process.exit(1);
}

// Test data
const testData = {
  conversationId: 'test-conversation-123',
  analysis: {
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '+1234567890',
    customerIndustry: 'Technology',
    customerProblem: 'Need chatbot solution',
    customerAvailability: 'Weekdays 9-5',
    customerConsultation: true,
    specialNotes: 'Test conversation for webhook',
    leadQuality: 'good'
  },
  transcript: 'User: Hello, I need a chatbot\nAssistant: Hi! I can help you with that.',
  timestamp: new Date().toISOString(),
  messageCount: 2,
  userMessageCount: 1,
  assistantMessageCount: 1,
  autoAnalyzed: true
};

async function testWebhook() {
  try {
    console.log('🧪 Testing webhook connection...');
    console.log('📤 Sending test data to:', WEBHOOK_URL);
    
    const response = await axios.post(WEBHOOK_URL, testData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NiO-Chatbot-Test/1.0'
      },
      timeout: 10000
    });
    
    console.log('✅ Webhook test successful!');
    console.log('📊 Response status:', response.status);
    console.log('📄 Response data:', response.data);
    
  } catch (error) {
    console.error('❌ Webhook test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Check if the webhook URL is correct and accessible.');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testWebhook(); 