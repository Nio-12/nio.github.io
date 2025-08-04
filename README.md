# NiO AI Chatbot - Serverless Version

Chatbot AI thông minh với khả năng xử lý cuộc hội thoại và phân tích khách hàng, được tối ưu hóa cho deployment trên Vercel.

## 🚀 Tính năng

- **Chat AI thông minh**: Tích hợp OpenAI GPT-3.5-turbo
- **Nhận dạng giọng nói**: Hỗ trợ tiếng Việt và tiếng Anh
- **Phát âm tự động**: Chuyển đổi text thành giọng nói
- **Dashboard quản lý**: Theo dõi và phân tích cuộc hội thoại
- **Lưu trữ dữ liệu**: Sử dụng Supabase để lưu trữ
- **Serverless Architecture**: Tối ưu cho Vercel deployment

## 📁 Cấu trúc dự án

```
nio.github.io/
├── api/                    # Serverless Functions
│   ├── chat.js            # Chat endpoint
│   ├── conversations.js   # Get conversations list
│   ├── conversations/[id].js # Conversation details/delete
│   ├── conversations/[id]/analyze.js # Analyze conversation
│   ├── health.js          # Health check
│   └── test-openai.js     # Test OpenAI connection
├── css/                   # Stylesheets
├── js/                    # Frontend JavaScript
├── image/                 # Images
├── index.html             # Main chatbot page
├── dashboard.html         # Admin dashboard
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies
```

## 🛠️ Cài đặt và Deploy

### 1. Chuẩn bị môi trường

```bash
# Clone repository
git clone <your-repo-url>
cd nio.github.io

# Cài đặt dependencies
npm install
```

### 2. Cấu hình Environment Variables

Tạo file `.env.local` (cho development) hoặc cấu hình trong Vercel:

```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
```

### 3. Deploy lên Vercel

#### Cách 1: Sử dụng Vercel CLI

```bash
# Cài đặt Vercel CLI
npm i -g vercel

# Login vào Vercel
vercel login

# Deploy
vercel --prod
```

#### Cách 2: Deploy qua GitHub

1. Push code lên GitHub
2. Kết nối repository với Vercel
3. Cấu hình environment variables trong Vercel dashboard
4. Deploy tự động

### 4. Cấu hình Supabase

Tạo bảng `conversations` trong Supabase:

```sql
CREATE TABLE conversations (
  conversation_id TEXT PRIMARY KEY,
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customerName TEXT,
  customerEmail TEXT,
  customerPhone TEXT,
  customerIndustry TEXT,
  customerProblem TEXT,
  customerAvailability TEXT,
  customerConsultation BOOLEAN DEFAULT FALSE,
  specialNotes TEXT,
  leadQuality TEXT DEFAULT 'ok'
);
```

## 🔧 API Endpoints

### Chat
- **POST** `/api/chat`
- Body: `{ message: string, sessionId: string }`
- Response: `{ response: string }`

### Conversations
- **GET** `/api/conversations` - Lấy danh sách conversations
- **GET** `/api/conversations/[id]` - Lấy chi tiết conversation
- **DELETE** `/api/conversations/[id]` - Xóa conversation
- **POST** `/api/conversations/[id]/analyze` - Phân tích conversation

### Health & Test
- **GET** `/api/health` - Health check
- **GET** `/api/test-openai` - Test OpenAI connection

## 🌐 URLs sau khi deploy

- **Chatbot**: `https://your-domain.vercel.app/`
- **Dashboard**: `https://your-domain.vercel.app/dashboard`
- **API Base**: `https://your-domain.vercel.app/api/`

## 🔄 Migration từ Persistent Server

### Những thay đổi chính:

1. **Loại bỏ Express server**: Không còn `server.js` và `app.listen()`
2. **Serverless Functions**: Mỗi endpoint là một function riêng biệt
3. **CORS handling**: Tự động xử lý trong mỗi function
4. **Environment detection**: Tự động phát hiện local/production
5. **Vercel configuration**: `vercel.json` để cấu hình routing

### Lợi ích của Serverless:

- ✅ **Auto-scaling**: Tự động scale theo traffic
- ✅ **Pay-per-use**: Chỉ trả tiền khi có request
- ✅ **Global CDN**: Tốc độ truy cập nhanh toàn cầu
- ✅ **Zero maintenance**: Không cần quản lý server
- ✅ **Automatic deployments**: Deploy tự động từ Git

## 🐛 Troubleshooting

### Lỗi thường gặp:

1. **CORS Error**: Đã được xử lý trong serverless functions
2. **Environment Variables**: Kiểm tra cấu hình trong Vercel dashboard
3. **Supabase Connection**: Đảm bảo URL và key đúng
4. **OpenAI API**: Kiểm tra API key và quota

### Debug:

```bash
# Local development
npm run dev

# Check logs
vercel logs

# Test API locally
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","sessionId":"test"}'
```

## 📝 License

MIT License - Xem file LICENSE để biết thêm chi tiết.

---

**NiO Creative** - AI Solutions for Modern Businesses 