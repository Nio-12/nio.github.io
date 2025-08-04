# 🤖 NiO AI Chatbot

Một chatbot AI thông minh được xây dựng với Node.js, OpenAI API và Supabase.

## ✨ Tính năng

- **💬 Chat thông minh** - Sử dụng OpenAI GPT-3.5-turbo
- **🎤 Voice Input/Output** - Hỗ trợ ghi âm và đọc văn bản
- **📊 Dashboard** - Quản lý và phân tích conversations
- **🔍 Customer Analysis** - Tự động extract thông tin khách hàng
- **💾 Database** - Lưu trữ với Supabase
- **📱 Responsive** - Giao diện thích ứng mọi thiết bị

## 🚀 Cài đặt

### Yêu cầu
- Node.js 16+
- npm hoặc yarn
- OpenAI API key
- Supabase account (optional)

### Bước 1: Clone repository
```bash
git clone https://github.com/yourusername/nio-chatbot.git
cd nio-chatbot
```

### Bước 2: Cài đặt dependencies
```bash
cd backend
npm install
```

### Bước 3: Cấu hình environment
Tạo file `.env` trong thư mục `backend/`:
```env
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_key_here
```

### Bước 4: Khởi động server
```bash
cd backend
node server.js
```

Server sẽ chạy trên `http://localhost:3001`

## 📁 Cấu trúc Project

```
nio-chatbot/
├── index.html              # Giao diện chính chatbot
├── dashboard.html          # Dashboard quản lý
├── voice-test.html         # Test tính năng giọng nói
├── css/                    # Styles
│   ├── chatbot.css
│   └── dashboard.css
├── js/                     # JavaScript
│   ├── chatbot.js
│   └── dashboard.js
├── image/                  # Hình ảnh
├── backend/                # Server Node.js
│   ├── server.js          # Main server
│   ├── package.json       # Dependencies
│   └── .env              # Environment variables
└── README.md
```

## 🔧 API Endpoints

### Chat
- `POST /api/chat` - Gửi tin nhắn đến chatbot

### Dashboard
- `GET /api/conversations` - Lấy danh sách conversations
- `GET /api/conversations/:id` - Lấy chi tiết conversation
- `DELETE /api/conversations/:id` - Xóa conversation
- `POST /api/conversations/:id/analyze` - Phân tích conversation

### Health Check
- `GET /api/health` - Kiểm tra trạng thái server
- `GET /api/test-openai` - Test kết nối OpenAI

## 🎯 Tính năng nâng cao

### Voice Features
- **Voice Input**: Ghi âm và chuyển thành text
- **Voice Output**: Đọc văn bản thành giọng nói
- **Multi-language**: Hỗ trợ tiếng Việt và tiếng Anh

### Customer Analysis
- **Auto-extract**: Tên, email, phone, industry
- **Lead Quality**: Phân loại lead (good/ok/spam)
- **Business Insights**: Problems, needs, availability

### Dashboard Features
- **Conversation Management**: Xem, xóa conversations
- **Search & Filter**: Tìm kiếm conversations
- **Real-time Updates**: Cập nhật real-time
- **Export Data**: Xuất dữ liệu phân tích

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js, Express.js
- **AI**: OpenAI GPT-3.5-turbo
- **Database**: Supabase (PostgreSQL)
- **Voice**: Web Speech API
- **Deployment**: Vercel (recommended)

## 📝 Cách sử dụng

### 1. Chat với AI
1. Mở `index.html` trong trình duyệt
2. Nhấn nút chat để mở chatbot
3. Gõ tin nhắn hoặc sử dụng voice input
4. AI sẽ trả lời thông minh

### 2. Dashboard
1. Mở `dashboard.html` trong trình duyệt
2. Xem danh sách conversations
3. Click vào conversation để xem chi tiết
4. Sử dụng "Analyze" để phân tích khách hàng

### 3. Voice Test
1. Mở `voice-test.html` trong trình duyệt
2. Test tính năng ghi âm và đọc văn bản
3. Kiểm tra hỗ trợ trình duyệt

## 🔒 Bảo mật

- API keys được lưu trong `.env` (không commit)
- CORS được cấu hình cho production
- Input validation và sanitization
- Error handling toàn diện

## 🚀 Deployment

### Vercel (Recommended)
1. Push code lên GitHub
2. Connect với Vercel
3. Set environment variables
4. Deploy tự động

### Railway
1. Connect GitHub repository
2. Set environment variables
3. Deploy với Railway

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

## 📄 License

MIT License - xem file LICENSE để biết thêm chi tiết.

## 📞 Support

Nếu có vấn đề, hãy:
1. Kiểm tra logs trong console
2. Test API endpoints
3. Kiểm tra environment variables
4. Tạo issue trên GitHub

---

**Made with ❤️ by NiO Team** 