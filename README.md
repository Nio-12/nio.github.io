# NiO AI Chatbot - Vercel Serverless

NiO AI Chatbot được xây dựng với Vercel serverless functions, sử dụng OpenAI GPT-3.5-turbo và Supabase để lưu trữ dữ liệu.

## 🚀 Tính năng

- **AI Chatbot thông minh** với GPT-3.5-turbo
- **Voice input/output** - Hỗ trợ nhập liệu và phát âm bằng giọng nói
- **Conversation history** - Lưu trữ và quản lý cuộc hội thoại
- **Responsive design** - Giao diện đẹp mắt trên mọi thiết bị
- **Serverless architecture** - Chạy trên Vercel với hiệu suất cao

## 🏗️ Kiến trúc

```
nio.github.io/
├── api/                    # Vercel serverless functions
│   ├── health.js          # Health check endpoint
│   ├── start.js           # Start conversation
│   ├── chat.js            # Chat endpoint
│   ├── conversations.js   # Conversations management
│   └── conversations/
│       └── [id].js        # Specific conversation
├── js/
│   ├── chatbot.js         # Frontend chatbot logic
│   └── dashboard.js       # Dashboard functionality
├── css/
│   ├── chatbot.css        # Chatbot styles
│   └── dashboard.css      # Dashboard styles
├── vercel.json            # Vercel configuration
└── package.json           # Dependencies
```

## 🛠️ Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd nio.github.io
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình Environment Variables

Tạo file `.env` hoặc cấu hình trong Vercel dashboard:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_service_key_here

# Environment
NODE_ENV=production
```

### 4. Cấu hình Supabase

Tạo bảng `conversations` trong Supabase:

```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  conversation_id TEXT UNIQUE NOT NULL,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create policy for service role
CREATE POLICY "Service role can do everything" ON conversations
  FOR ALL USING (auth.role() = 'service_role');
```

## 🚀 Deployment

### Deploy lên Vercel

1. **Cài đặt Vercel CLI:**
```bash
npm i -g vercel
```

2. **Login vào Vercel:**
```bash
vercel login
```

3. **Deploy:**
```bash
vercel --prod
```

4. **Cấu hình Environment Variables trong Vercel Dashboard:**
   - Vào project settings
   - Thêm các biến môi trường: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY`

### Development

```bash
# Chạy development server
npm run dev

# Deploy production
npm run deploy
```

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Start Conversation
```
POST /api/start
```

### Chat
```
POST /api/chat
Body: { "message": "Hello", "sessionId": "conversation-id" }
```

### Get Conversations
```
GET /api/conversations
```

### Get Specific Conversation
```
GET /api/conversations/[id]
```

### Delete Conversation
```
DELETE /api/conversations?id=[conversation-id]
```

### Analyze Conversation
```
POST /api/conversations?id=[conversation-id]
```

## 🎨 Tính năng Frontend

- **Compact Mode** - Chatbot nhỏ gọn ở góc màn hình
- **Voice Control** - Nhập liệu và phát âm bằng giọng nói
- **Responsive Design** - Tương thích mobile và desktop
- **Real-time Chat** - Trò chuyện mượt mà với AI
- **Conversation History** - Lưu trữ và xem lại cuộc hội thoại

## 🔧 Cấu hình

### Vercel Configuration (`vercel.json`)
```json
{
  "version": 2,
  "functions": {
    "api/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ]
}
```

## 📊 Monitoring

- **Vercel Analytics** - Theo dõi performance
- **Vercel Functions Logs** - Xem logs của serverless functions
- **Supabase Dashboard** - Quản lý database và conversations

## 🚀 Performance

- **Serverless Functions** - Tự động scale theo traffic
- **Edge Network** - CDN toàn cầu của Vercel
- **Cold Start Optimization** - Tối ưu thời gian khởi động
- **Database Connection Pooling** - Supabase connection management

## 🔒 Security

- **CORS Configuration** - Chỉ cho phép domain được phép
- **Environment Variables** - Bảo mật API keys
- **Supabase RLS** - Row Level Security cho database
- **Input Validation** - Validate tất cả input từ user

## 📝 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📞 Support

- **Email:** support@niocreative.com
- **Website:** https://niocreative.com
- **Documentation:** https://docs.niocreative.com 