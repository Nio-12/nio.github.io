# NiO AI Chatbot

Một ứng dụng chatbot AI hiện đại với giao diện đẹp mắt và dashboard quản lý cuộc hội thoại.

## 🚀 Tính năng

- **Chatbot AI thông minh**: Tích hợp OpenAI GPT-4 để trả lời tự động
- **Giao diện hiện đại**: Thiết kế responsive với hiệu ứng mượt mà
- **Dashboard quản lý**: Xem và phân tích tất cả cuộc hội thoại
- **Phân tích khách hàng**: AI tự động trích xuất thông tin khách hàng
- **Webhook Integration**: Tự động gửi dữ liệu conversation đến webhook và cập nhật Supabase
- **Lưu trữ linh hoạt**: Hỗ trợ Supabase hoặc lưu trữ trong bộ nhớ
- **Tối ưu hóa SEO**: Meta tags và accessibility tốt

## 🛠️ Công nghệ sử dụng

### Frontend
- **HTML5**: Semantic markup với accessibility
- **CSS3**: Modern styling với animations và responsive design
- **JavaScript ES6+**: Class-based architecture với best practices
- **Font Awesome**: Icons cho UI

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **OpenAI API**: AI chatbot integration
- **Supabase**: Database và authentication (optional)
- **CORS**: Cross-origin resource sharing

## 📁 Cấu trúc dự án

```
nio.github.io/
├── index.html              # Trang chủ với chatbot
├── dashboard.html          # Dashboard quản lý
├── css/
│   ├── chatbot.css        # Styles cho chatbot
│   └── dashboard.css      # Styles cho dashboard
├── js/
│   ├── chatbot.js         # Logic cho chatbot
│   └── dashboard.js       # Logic cho dashboard
├── backend/
│   ├── server.js          # Express server
│   └── package.json       # Dependencies
├── image/                 # Hình ảnh và icons
└── README.md             # Hướng dẫn này
```

## 🚀 Cài đặt và chạy

### 1. Clone repository
```bash
git clone https://github.com/yourusername/nio-chatbot.git
cd nio-chatbot
```

### 2. Cài đặt dependencies
```bash
cd backend
npm install
```

### 3. Cấu hình environment variables
Tạo file `.env` trong thư mục `backend/`:

```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (optional)
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here

# Server Configuration
PORT=3001
NODE_ENV=development
```

### 4. Chạy server
```bash
# Development mode với auto-reload
npm run dev

# Production mode
npm start
```

### 5. Mở ứng dụng
- **Chatbot**: Mở `index.html` trong trình duyệt
- **Dashboard**: Mở `dashboard.html` hoặc click "Dashboard" trong chatbot

## 🔧 Cấu hình

### OpenAI API
1. Đăng ký tài khoản tại [OpenAI](https://platform.openai.com/)
2. Tạo API key trong dashboard
3. Thêm API key vào file `.env`

### Supabase (Optional)
1. Tạo project tại [Supabase](https://supabase.com/)
2. Tạo bảng `conversations` với schema:
```sql
CREATE TABLE conversations (
  conversation_id TEXT PRIMARY KEY,
  messages JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customerName TEXT,
  customerEmail TEXT,
  customerPhone TEXT,
  customerIndustry TEXT,
  customerProblem TEXT,
  customerAvailability TEXT,
  customerConsultation BOOLEAN,
  specialNotes TEXT,
  leadQuality TEXT,
  webhookNotes TEXT,
  webhookStatus TEXT,
  webhookProcessed BOOLEAN
);
```

### Webhook Integration (Optional)
1. Tạo webhook endpoint để nhận dữ liệu conversation
2. Thêm `WEBHOOK_URL` vào file `.env`:
```env
WEBHOOK_URL=https://your-webhook-endpoint.com/webhook
```
3. Xem chi tiết cấu hình tại [backend/WEBHOOK_SETUP.md](backend/WEBHOOK_SETUP.md)

## 📊 API Endpoints

### Chat
- `POST /api/chat` - Gửi tin nhắn và nhận phản hồi từ AI (tự động phân tích nếu có webhook)

### Conversations
- `GET /api/conversations` - Lấy danh sách tất cả cuộc hội thoại
- `GET /api/conversations/:id` - Lấy chi tiết cuộc hội thoại
- `DELETE /api/conversations/:id` - Xóa cuộc hội thoại
- `POST /api/conversations/:id/analyze` - Phân tích cuộc hội thoại và gửi đến webhook

### Health Check
- `GET /health` - Kiểm tra trạng thái server

## 🎨 Tùy chỉnh

### Thay đổi theme
Chỉnh sửa CSS variables trong `css/chatbot.css`:
```css
:root {
  --primary-color: #e50914;
  --background-color: #000;
  --text-color: #eee;
}
```

### Thay đổi AI prompt
Chỉnh sửa system prompt trong `backend/server.js`:
```javascript
const systemPrompt = `Your custom AI assistant prompt here...`;
```

### Thêm tính năng mới
1. Tạo endpoint mới trong `backend/server.js`
2. Thêm UI component trong HTML
3. Viết JavaScript logic trong file tương ứng
4. Style với CSS

## 🔒 Bảo mật

- **CORS**: Được cấu hình cho production
- **Input validation**: Tất cả input được validate
- **Error handling**: Comprehensive error handling
- **Rate limiting**: Có thể thêm với middleware

## 📱 Responsive Design

Ứng dụng được tối ưu cho:
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: 320px - 767px

## ♿ Accessibility

- **ARIA labels**: Tất cả interactive elements
- **Keyboard navigation**: Hỗ trợ điều hướng bằng bàn phím
- **Screen readers**: Semantic HTML structure
- **High contrast**: Hỗ trợ chế độ tương phản cao

## 🚀 Performance

- **Lazy loading**: Images được load lazy
- **Minification**: CSS và JS được tối ưu
- **Caching**: Browser caching được cấu hình
- **CDN**: Có thể deploy lên CDN

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

Dự án này được cấp phép theo MIT License - xem file [LICENSE](LICENSE) để biết thêm chi tiết.

## 📞 Liên hệ

- **Website**: [NiO Creative](https://niocreative.com)
- **Email**: contact@niocreative.com
- **GitHub**: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- OpenAI cho AI capabilities
- Supabase cho database services
- Font Awesome cho icons
- Cộng đồng open source

---

**Made with ❤️ by NiO Creative** 