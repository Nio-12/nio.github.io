# Webhook Setup Guide

## Overview
The chatbot now automatically sends conversation data to a webhook URL after each chat interaction. This allows you to process conversation data externally and return additional information to be stored in Supabase.

## Configuration

### 1. Environment Variables
Add the following to your `.env` file:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here

# Webhook Configuration
WEBHOOK_URL=https://your-webhook-endpoint.com/webhook

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 2. Install Dependencies
```bash
npm install
```

## How It Works

### Automatic Analysis
- After each chat message, the system automatically analyzes the conversation
- Customer information is extracted using OpenAI GPT-4
- Analysis data is sent to your webhook URL
- Webhook response is used to update Supabase

### Webhook Data Format
The webhook receives the following JSON payload:

```json
{
  "conversationId": "abc123def",
  "analysis": {
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "+1234567890",
    "customerIndustry": "Technology",
    "customerProblem": "Need chatbot solution",
    "customerAvailability": "Weekdays 9-5",
    "customerConsultation": true,
    "specialNotes": "Interested in AI features",
    "leadQuality": "good"
  },
  "transcript": "User: Hello...\nAssistant: Hi there...",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "messageCount": 10,
  "userMessageCount": 5,
  "assistantMessageCount": 5,
  "autoAnalyzed": true
}
```

### Webhook Response Format
Your webhook can return additional data to be stored in Supabase:

```json
{
  "customerName": "Updated Name",
  "customerEmail": "updated@example.com",
  "webhookNotes": "Additional processing notes",
  "webhookStatus": "processed",
  "webhookProcessed": true
}
```

## Database Schema

The following fields are automatically updated in the `conversations` table:

- `customerName` - Customer's name
- `customerEmail` - Customer's email
- `customerPhone` - Customer's phone number
- `customerIndustry` - Customer's industry
- `customerProblem` - Customer's problem/needs
- `customerAvailability` - Customer's availability
- `customerConsultation` - Whether consultation is booked
- `specialNotes` - Special notes about the customer
- `leadQuality` - Lead quality (good/ok/spam)
- `webhookNotes` - Notes from webhook processing
- `webhookStatus` - Status from webhook
- `webhookProcessed` - Whether webhook processed the data

## API Endpoints

### Manual Analysis
`POST /api/conversations/:conversationId/analyze`
- Manually trigger analysis for a specific conversation
- Returns analysis data and webhook response

### Chat with Auto-Analysis
`POST /api/chat`
- Handles chat messages
- Automatically analyzes conversation if webhook is configured
- Updates Supabase with analysis and webhook data

## Error Handling

- Webhook failures don't affect chat functionality
- Analysis errors are logged but don't break the chat flow
- Supabase update errors are logged but don't fail the request

## Testing

1. Set up your webhook endpoint
2. Configure the `WEBHOOK_URL` environment variable
3. Start the server: `npm start`
4. Send a chat message
5. Check logs for webhook calls and responses
6. Verify data is updated in Supabase

## Security Notes

- Webhook URLs should use HTTPS in production
- Consider adding authentication to your webhook endpoint
- Validate webhook responses before updating database
- Monitor webhook response times to avoid timeouts 