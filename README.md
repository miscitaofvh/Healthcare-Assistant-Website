# 🏥 Website Trợ Lý Y Tế

<div align="center">
  
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![MySQL](https://img.shields.io/badge/MySQL-latest-orange)
![Status](https://img.shields.io/badge/status-in%20development-yellow)

**Nền tảng y tế số hiện đại kết nối người dùng với thông tin y khoa chất lượng**

</div>

## 📋 Mục Lục

- [Tổng Quan](#-tổng-quan)
- [Tính Năng Chính](#-tính-năng-chính)
- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Cấu Trúc Dự Án](#-cấu-trúc-dự-án)
- [Hướng Dẫn Cài Đặt & Sử Dụng](#-hướng-dẫn-cài-đặt--sử-dụng)
- [Đóng Góp](#-đóng-góp)
- [Liên Hệ](#-liên-hệ)

## 🔍 Tổng Quan

Website Trợ Lý Y Tế là một nền tảng y tế số hiện đại nhằm kết nối người dùng với thông tin y khoa chất lượng và hỗ trợ chăm sóc sức khỏe toàn diện. Hệ thống được thiết kế với:

- ✨ Giao diện thân thiện, dễ sử dụng
- 🧠 Tích hợp công nghệ trí tuệ nhân tạo tiên tiến
- 🎯 Trải nghiệm tư vấn sức khỏe cá nhân hóa, chính xác

Dự án được phát triển trên kiến trúc microservices với phân tách rõ ràng giữa frontend và backend, đảm bảo khả năng mở rộng và bảo trì hiệu quả. Hệ thống an toàn thông tin đa lớp giúp bảo vệ dữ liệu người dùng, tuân thủ các quy định về quyền riêng tư trong lĩnh vực y tế.

## ✅ Tính Năng Chính

| Tính Năng | Mô Tả |
|-----------|-------|
| 🔐 **Đăng ký và Xác thực** | Hệ thống JWT đảm bảo an toàn cho người dùng |
| 👤 **Hồ sơ Người dùng** | Quản lý thông tin cá nhân và lịch sử y tế |
| 💬 **Diễn đàn Y tế** | Nền tảng thảo luận về các vấn đề sức khỏe với thẻ và bình luận |
| 📝 **Bài viết Y khoa** | Hệ thống quản lý bài viết với phân loại và thẻ |
| 🤖 **Trò chuyện Y tế AI** | Tích hợp chatbot sử dụng Ollama LLM hỗ trợ người dùng |
| 🔒 **Bảo mật** | Hệ thống xử lý giao dịch an toàn với bảo vệ middleware |

## 💻 Công Nghệ Sử Dụng

<div align="center">
  
### Frontend
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)

### Database
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

### Security & APIs
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![REST API](https://img.shields.io/badge/REST%20API-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

### AI Integration
![AI](https://img.shields.io/badge/Ollama%20LLM-412991?style=for-the-badge&logo=openai&logoColor=white)

</div>

## 📂 Cấu Trúc Dự Án

<details>
<summary>Click để xem cấu trúc chi tiết</summary>

```
Healthcare-Assistant-Website/
├── FrontEnd/                   # Ứng dụng React với Vite
│   ├── public/                 # Tài nguyên tĩnh
│   ├── src/                    # Mã nguồn frontend
│   │   ├── assets/             # Hình ảnh, icons và tài nguyên
│   │   ├── components/         # Components tái sử dụng
│   │   │   ├── Navbar/         # Thanh điều hướng
│   │   │   ├── ChatBot/        # Component chatbot AI
│   │   │   └── ...             # Các component khác
│   │   ├── contexts/           # React context (Auth, Modal, User)
│   │   ├── pages/              # Các trang ứng dụng
│   │   │   ├── Home/           # Trang chủ
│   │   │   ├── About/          # Trang giới thiệu
│   │   │   ├── Contact/        # Trang liên hệ
│   │   │   ├── Forum/          # Trang diễn đàn
│   │   │   ├── Article/        # Trang bài viết
│   │   │   └── ...             # Các trang khác
│   │   └── utils/              # Các tiện ích và services
│   │       ├── api/            # Xử lý API calls
│   │       ├── service/        # Services cho các tính năng
│   │       └── validate/       # Validators
│   └── package.json            # Cấu hình và dependencies frontend
│
├── BackEnd/                    # Backend Node.js/Express
│   ├── config/                 # Cấu hình và kết nối
│   │   ├── chatbot/            # Cấu hình cho chatbot AI
│   │   ├── connection.js       # Kết nối database với pool
│   │   └── db.sql              # File khởi tạo cấu trúc database
│   ├── controllers/            # Xử lý logic nghiệp vụ
│   │   ├── authController.js   # Xử lý xác thực
│   │   ├── forumController.js  # Xử lý diễn đàn
│   │   └── ...                 # Các controllers khác
│   ├── middleware/             # Middleware xác thực và validation
│   │   └── validation/         # Schema validation
│   ├── models/                 # Mô hình dữ liệu
│   │   ├── User.js             # Model người dùng
│   │   ├── Article.js          # Model bài viết
│   │   └── ...                 # Các models khác
│   ├── routes/                 # Định nghĩa các API endpoint
│   │   ├── authRoutes.js       # Routes xác thực
│   │   ├── forumRoutes.js      # Routes diễn đàn
│   │   └── ...                 # Các routes khác
│   ├── utils/                  # Tiện ích
│   └── package.json            # Cấu hình và dependencies backend
│
├── package.json                # Cấu hình chính và scripts chạy toàn dự án
└── README.md                   # Tài liệu chính
```
</details>

## 🚀 Hướng Dẫn Cài Đặt & Sử Dụng

### Yêu Cầu Hệ Thống

- Node.js (v14.x hoặc cao hơn)
- MySQL
- Ollama (cho tính năng chatbot)
- Python 3.8+ (cho cấu hình chatbot)

### Các Bước Cài Đặt

#### 1️⃣ Khởi tạo Cơ Sở Dữ Liệu:

```bash
# Đăng nhập vào MySQL
cd <đường_dẫn_tới_dự_án>/BackEnd/config
mysql --default-character-set=utf8mb4 -u amh -p healthcare_service_db < db.sql
```

**Lưu ý:** Thay `<đường_dẫn_tới_dự_án>` bằng đường dẫn thực tế đến thư mục dự án trên máy tính của bạn.

#### 2️⃣ Khởi chạy toàn bộ dự án:

```bash
# Cài đặt các phụ thuộc và khởi chạy cả frontend và backend
npm run dev
```

Lệnh này sẽ khởi động cả frontend và backend song song.

#### 3️⃣ Cài đặt Chatbot (bắt buộc cho tính năng AI):

```bash
# Di chuyển đến thư mục cấu hình chatbot
cd BackEnd/config/chatbot

# Cài đặt các thư viện Python cần thiết
pip install -r requirements.txt

# Khởi chạy cài đặt chatbot
python start.py
```

### 🔧 Cấu Hình Môi Trường

Tạo file `.env` trong thư mục Backend với các biến môi trường cần thiết:

```
# Cấu hình Database
DB_HOST=<địa_chỉ_máy_chủ_database>
DB_USER=<tên_người_dùng_database>
DB_PASSWORD=<mật_khẩu_database>
DB_NAME=healthcare_service_db

# Cấu hình Email
EMAIL_USER=<email_của_bạn>
EMAIL_PASSWORD=<mật_khẩu_email>

# Cấu hình Redis (tùy chọn)
REDIS_URL=<url_redis_của_bạn>  

# Bảo mật
JWT_SECRET=<khóa_bí_mật_jwt>   # Chuỗi ngẫu nhiên an toàn
EMAIL_SECRET=<khóa_bí_mật_email>

# Cấu hình Server
PORT=5000                       # Hoặc cổng tùy chọn khác

# Cấu hình AI
AI_MODEL_NAME=<tên_mô_hình>     # Trong dự án đang sử dụng mặc định là AMH_chatbot

# Cấu hình ImageKit
IMAGEKIT_PUBLIC_KEY=<public_key_của_bạn>
IMAGEKIT_PRIVATE_KEY=<private_key_của_bạn>
IMAGEKIT_URL_ENDPOINT=<endpoint>
```

> **Lưu ý:** Thay thế các giá trị trong `< >` bằng thông tin thực tế của bạn. Tránh đưa các thông tin nhạy cảm vào hệ thống quản lý mã nguồn.

## 👨‍💻 Đóng Góp

Chúng tôi luôn chào đón mọi đóng góp! Dưới đây là các bước để bắt đầu:

1. 🍴 **Fork** dự án
2. 🌿 Tạo nhánh tính năng (`git checkout -b feature/tinh-nang-moi`)
3. 💾 Commit thay đổi (`git commit -m 'Thêm tính năng mới'`)
4. 📤 Push lên nhánh của bạn (`git push origin feature/tinh-nang-moi`)
5. 🔄 Tạo một Pull Request mới

## 📞 Liên Hệ

<div align="center">
  
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/healthcare-assistant)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:contact@healthcare-assistant.com)

</div>

---

<div align="center">
  
**🌟 Trợ Lý Y Tế - Công Nghệ Chăm Sóc Sức Khỏe Hiện Đại 🌟**

<small><i>Lưu ý: Đây là một dự án đang phát triển. Chức năng và tài liệu có thể thay đổi.</i></small>

</div>
