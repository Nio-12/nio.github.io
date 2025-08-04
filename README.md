# NiO AI Chatbot - Serverless Version

## 🚀 Overview

NiO AI Chatbot được thiết kế để chạy trên Vercel serverless functions, cung cấp giải pháp chatbot thông minh với tích hợp OpenAI và Supabase.

## ✨ Features

- 🤖 **AI Chatbot**: Tích hợp OpenAI GPT-3.5-turbo
- 💬 **Conversation Management**: Lưu trữ và quản lý cuộc hội thoại
- 📊 **Dashboard**: Giao diện quản lý conversations
- 🎯 **Lead Analysis**: Phân tích khách hàng tự động
- 🌐 **Serverless**: Deploy trên Vercel không cần server
- 🔒 **Secure**: Environment variables bảo mật

## 🏗️ Project Structure

```
nio.github.io/
├── api/                          # Serverless Functions
│   ├── chat.js                   # Chat API endpoint
│   ├── conversations.js          # Conversations list API
│   ├── conversations/[id].js     # Single conversation API
│   ├── conversations/[id]/analyze.js # Analysis API
│   ├── health.js                 # Health check API
│   └── test-openai.js           # OpenAI test API
├── js/
│   ├── chatbot.js               # Frontend chatbot logic
│   └── dashboard.js             # Dashboard logic
├── css/
│   ├── chatbot.css              # Chatbot styles
│   └── dashboard.css            # Dashboard styles
├── image/                       # Static images
├── index.html                   # Main chatbot page
├── dashboard.html               # Dashboard page
├── package.json                 # Dependencies
├── vercel.json                  # Vercel configuration
└── .env.example                 # Environment variables template
```

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-username/nio.github.io.git
cd nio.github.io
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Cập nhật các giá trị:
```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_KEY=your_supabase_anon_key_here
NODE_ENV=production
```

### 4. Local Development
```bash
npm run dev
```

### 5. Deploy to Vercel
```bash
npm run deploy
```

## 🔧 API Endpoints

### Chat API
- **POST** `/api/chat`
- **Body**: `{ "message": "string", "sessionId": "string" }`
- **Response**: `{ "response": "string" }`

### Conversations API
- **GET** `/api/conversations`
- **Response**: `{ "conversations": [...] }`

### Conversation Details
- **GET** `/api/conversations/[id]`
- **Response**: `{ "conversationId": "string", "messages": [...] }`

### Delete Conversation
- **DELETE** `/api/conversations/[id]`
- **Response**: `{ "success": true }`

### Analyze Conversation
- **POST** `/api/conversations/[id]/analyze`
- **Response**: `{ "analysis": {...} }`

### Health Check
- **GET** `/api/health`
- **Response**: `{ "status": "OK", ... }`

## 🌐 Deployment

### Vercel Deployment

1. **Connect to Vercel**:
```bash
vercel login
vercel
```

2. **Set Environment Variables**:
```bash
vercel env add OPENAI_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_KEY
```

3. **Deploy**:
```bash
vercel --prod
```

### Environment Variables Setup

Trong Vercel Dashboard:
1. Vào Project Settings
2. Chọn Environment Variables
3. Thêm các biến:
   - `OPENAI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

## 🔍 Troubleshooting

### Common Issues

1. **404 Error on API calls**:
   - Kiểm tra `vercel.json` configuration
   - Đảm bảo serverless functions được deploy

2. **CORS Errors**:
   - Serverless functions đã có CORS headers
   - Kiểm tra API URL trong frontend

3. **Environment Variables**:
   - Kiểm tra Vercel environment variables
   - Đảm bảo tên biến chính xác

4. **OpenAI API Errors**:
   - Kiểm tra API key
   - Kiểm tra quota và billing

### Debug Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Test API locally
vercel dev

# Check environment variables
vercel env ls
```

## 📝 Development

### Local Development
```bash
# Start local server
npm run dev

# Test API endpoints
curl http://localhost:3000/api/health
```

### Adding New API Endpoints

1. Tạo file trong thư mục `api/`
2. Export default function handler
3. Thêm CORS headers
4. Deploy lên Vercel

### Frontend Development

- Sử dụng relative URLs cho API calls
- Test với `vercel dev` cho local development
- Deploy để test production

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- 📧 Email: support@nio.com
- 💬 Discord: [NiO Community]
- 📖 Documentation: [Wiki]

---

**NiO Creative** - Building the future of AI chatbots 🚀 