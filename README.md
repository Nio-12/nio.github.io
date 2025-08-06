# NiO AI Chatbot

A modern AI chatbot built with Express.js, OpenAI, and Supabase.

## 🚀 Features

- **AI-Powered Chat**: Powered by OpenAI GPT-3.5-turbo
- **Voice Input/Output**: Speech recognition and synthesis
- **Conversation Management**: Store and retrieve chat history
- **Dashboard**: View and manage all conversations
- **Real-time Typing**: Animated typing effect
- **Responsive Design**: Works on desktop and mobile

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **AI**: OpenAI API
- **Database**: Supabase (PostgreSQL)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Voice**: Web Speech API

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/nio-chatbot.git
   cd nio-chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file:
   ```env
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url_here
   SUPABASE_KEY=your_supabase_anon_key_here

   # Optional: Node Environment
   NODE_ENV=development
   ```

4. **Set up Supabase Database**
   
   Create a table called `conversations` with the following structure:
   ```sql
   CREATE TABLE conversations (
     conversation_id TEXT PRIMARY KEY,
     messages JSONB DEFAULT '[]',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001`

## 📁 Project Structure

```
nio-chatbot/
├── backend/
│   ├── server.js          # Express server
│   └── package.json       # Backend dependencies
├── css/
│   ├── chatbot.css        # Chatbot styles
│   └── dashboard.css      # Dashboard styles
├── js/
│   ├── chatbot.js         # Chatbot functionality
│   └── dashboard.js       # Dashboard functionality
├── image/                 # Static images
├── index.html             # Main page
├── dashboard.html         # Dashboard page
├── package.json           # Root dependencies
└── README.md
```

## 🔧 API Endpoints

### Chat
- `POST /api/chat` - Send a message to the AI

### Conversations
- `GET /api/conversations` - Get all conversations
- `GET /api/conversations/:id` - Get specific conversation
- `DELETE /api/conversations/:id` - Delete conversation
- `POST /api/conversations/:id/analyze` - Analyze conversation

### System
- `POST /start` - Start a new conversation
- `GET /api/health` - Health check

## 🎯 Usage

1. **Start the server**: `npm run dev`
2. **Open browser**: Navigate to `http://localhost:3001`
3. **Chat with AI**: Click the chatbot icon and start chatting
4. **View dashboard**: Click the dashboard button to see all conversations

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_KEY` | Your Supabase anon key | Yes |
| `NODE_ENV` | Environment (development/production) | No |

### Supabase Setup

1. Create a new Supabase project
2. Get your project URL and anon key
3. Create the `conversations` table
4. Add the credentials to your `.env` file

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**NiO Creative** - Building the future of AI chatbots 🚀 